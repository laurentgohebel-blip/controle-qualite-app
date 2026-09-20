-- ============================================================
-- Couche de config sectorielle + valeur probante des contrôles
-- À exécuter par blocs, dans l'ordre. Le bloc 0 ne modifie rien.
-- ============================================================

-- ------------------------------------------------------------
-- BLOC 0 — DIAGNOSTIC (à lancer seul, avant toute modification)
-- ------------------------------------------------------------

-- 0.a Combien de résultats pointent déjà vers un critère disparu ?
--     Ces lignes sont définitivement perdues : la dénormalisation
--     ne pourra pas les reconstituer.
select count(*) as resultats_orphelins
from resultats r
where not exists (select 1 from criteres c where c.id = r.critere_id);

-- 0.b Les ids de critères sont-ils uniques toutes organisations confondues ?
--     Si cette requête renvoie des lignes, ajouter « and c.org_id = r.org_id »
--     dans les backfills du bloc 2.
select id, count(*) from criteres group by id having count(*) > 1;

-- 0.c Des résultats rattachés à une organisation différente de leur contrôle ?
select count(*) as incoherences_org
from resultats r join controles c on c.id = r.controle_id
where r.org_id is distinct from c.org_id;


-- ------------------------------------------------------------
-- BLOC 1 — NOUVELLES COLONNES
-- ------------------------------------------------------------

-- 1.a Dénormalisation : le résultat porte lui-même ce qui a servi à le noter.
alter table resultats
  add column if not exists critere_libelle   text,
  add column if not exists critere_categorie text,
  add column if not exists coefficient       integer,
  add column if not exists criticite         text;

-- 1.b Criticité et archivage sur les critères (remplace la suppression).
alter table criteres
  add column if not exists criticite   text not null default 'normale',
  add column if not exists archived_at timestamptz;

alter table criteres
  drop constraint if exists criteres_criticite_check;
alter table criteres
  add constraint criteres_criticite_check
  check (criticite in ('normale', 'majeure', 'bloquante'));

-- 1.c Gel du référentiel au moment du contrôle.
--     grille_snapshot : les critères tels qu'ils étaient (libellé, coef, criticité)
--     config_snapshot : l'échelle de notation et les règles de calcul
alter table controles
  add column if not exists config_version  integer,
  add column if not exists config_snapshot jsonb,
  add column if not exists grille_snapshot jsonb,
  add column if not exists gele_at         timestamptz;

-- 1.d Secteur et configuration au niveau de l'organisation.
alter table organizations
  add column if not exists secteur text not null default 'proprete',
  add column if not exists config  jsonb;


-- ------------------------------------------------------------
-- BLOC 2 — BACKFILL DE L'EXISTANT
-- ------------------------------------------------------------

-- 2.a Recopier les critères actuels dans les résultats historiques.
--     Voir 0.b : ajouter le filtre org_id si les ids ne sont pas uniques.
update resultats r
set critere_libelle   = c.libelle,
    critere_categorie = c.categorie,
    coefficient       = c.coefficient,
    criticite         = coalesce(c.criticite, 'normale')
from criteres c
where c.id = r.critere_id
  and r.coefficient is null;

-- 2.b Marquer explicitement ce qui n'a pas pu être reconstitué,
--     plutôt que de laisser un NULL ambigu.
update resultats
set critere_libelle = '[critère supprimé]',
    criticite       = 'normale'
where critere_libelle is null;

-- 2.c Geler la grille des contrôles déjà terminés.
update controles ct
set grille_snapshot = sub.grille,
    config_version  = 1,
    gele_at         = now()
from (
  select r.controle_id,
         jsonb_agg(distinct jsonb_build_object(
           'critere_id',  r.critere_id,
           'libelle',     r.critere_libelle,
           'categorie',   r.critere_categorie,
           'coefficient', r.coefficient,
           'criticite',   r.criticite
         )) as grille
  from resultats r
  group by r.controle_id
) sub
where sub.controle_id = ct.id
  and ct.grille_snapshot is null
  and ct.statut in ('Terminé', 'Validé');

-- 2.d Échelle de notation historique, figée sur les contrôles passés.
update controles
set config_snapshot = jsonb_build_object(
  'version', 1,
  'secteur', 'proprete',
  'notes', jsonb_build_array(
    jsonb_build_object('cle','Conforme','valeur',1,'exclu',false),
    jsonb_build_object('cle','Partiellement conforme','valeur',0.5,'exclu',false),
    jsonb_build_object('cle','Non conforme','valeur',0,'exclu',false),
    jsonb_build_object('cle','Non applicable','valeur',0,'exclu',true)
  ),
  'scoring', jsonb_build_object(
    'methode','moyenne_ponderee','arrondi','entier',
    'criticiteBloquanteActive',false,'poidsCriticiteMajeure',1
  )
)
where config_snapshot is null
  and statut in ('Terminé', 'Validé');


-- ------------------------------------------------------------
-- BLOC 3 — GARDE-FOUS
-- ------------------------------------------------------------

-- 3.a Un résultat ne peut plus appartenir à une autre organisation
--     que son contrôle parent. Filet sous la RLS, pas à sa place.
create or replace function check_resultat_org() returns trigger as $$
begin
  if new.org_id is distinct from (select org_id from controles where id = new.controle_id) then
    raise exception 'org_id du résultat incohérent avec le contrôle parent';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_resultat_org on resultats;
create trigger trg_resultat_org
  before insert or update on resultats
  for each row execute function check_resultat_org();

-- 3.b Interdire la modification d'un contrôle déjà gelé.
create or replace function protect_controle_gele() returns trigger as $$
begin
  if old.gele_at is not null and old.statut = 'Validé'
     and new.grille_snapshot is distinct from old.grille_snapshot then
    raise exception 'grille_snapshot est immuable sur un contrôle validé';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_controle_gele on controles;
create trigger trg_controle_gele
  before update on controles
  for each row execute function protect_controle_gele();

-- 3.c Index sur les jointures les plus chaudes.
create index if not exists idx_resultats_controle on resultats(controle_id);
create index if not exists idx_controles_site_date on controles(site_id, date desc);
create index if not exists idx_criteres_org_actifs on criteres(org_id) where archived_at is null;

-- 3.d OPTIONNEL — clé étrangère sur le critère.
--     À n'activer qu'après avoir remplacé toutes les suppressions
--     de critères par un archivage (criteres.archived_at).
-- alter table resultats
--   add constraint resultats_critere_fk
--   foreign key (critere_id) references criteres(id) on delete restrict;


-- ------------------------------------------------------------
-- BLOC 4 — VÉRIFICATION
-- ------------------------------------------------------------

select
  (select count(*) from resultats where coefficient is null)                  as resultats_sans_coef,
  (select count(*) from resultats where critere_libelle = '[critère supprimé]') as lignes_perdues,
  (select count(*) from controles
    where statut in ('Terminé','Validé') and grille_snapshot is null)          as controles_non_geles;
