-- ============================================================
-- Modèle contradictoire : deux notations sur un même relevé
-- Additif. Tant qu'aucune note client n'est saisie, tout se
-- comporte exactement comme aujourd'hui.
-- ============================================================

-- ------------------------------------------------------------
-- BLOC 1 — LA SECONDE NOTATION
-- ------------------------------------------------------------

-- resultats.note reste la notation du PRESTATAIRE. On ajoute celle du client
-- et la note finalement retenue, qui dépend de la règle d'arbitrage.
alter table resultats
  add column if not exists note_client   text,
  add column if not exists note_retenue  text,
  add column if not exists divergence    boolean
    generated always as (note_client is not null and note_client is distinct from note) stored;

comment on column resultats.note is
  'Notation du prestataire. Le contradictoire ne la modifie jamais.';
comment on column resultats.note_retenue is
  'Note appliquée au calcul contractuel, posée par la règle d''arbitrage.';

-- ------------------------------------------------------------
-- BLOC 2 — LE CONTRÔLE PORTE LES DEUX TAUX
-- ------------------------------------------------------------

alter table controles
  add column if not exists taux_client      integer,
  add column if not exists taux_retenu      integer,
  add column if not exists nb_divergences   integer not null default 0,
  add column if not exists mode_arbitrage   text,
  add column if not exists arbitre_par      uuid,
  add column if not exists arbitre_at       timestamptz;

alter table controles
  drop constraint if exists controles_arbitrage_check;
alter table controles
  add constraint controles_arbitrage_check
  check (mode_arbitrage is null or mode_arbitrage in
    ('prestataire', 'client', 'moyenne', 'defavorable', 'manuel'));

-- Le taux historique reste celui du prestataire : aucun contrôle passé ne bouge.
update controles
set taux_retenu = taux_conformite,
    mode_arbitrage = 'prestataire'
where taux_retenu is null
  and taux_conformite is not null;

-- ------------------------------------------------------------
-- BLOC 3 — TRAÇABILITÉ DE L'ARBITRAGE
-- ------------------------------------------------------------

-- Qui a tranché quoi, et sur quel motif. Sans cette table, un arbitrage
-- contesté n'est pas défendable.
create table if not exists arbitrages (
  id           uuid primary key default gen_random_uuid(),
  controle_id  text not null references controles(id) on delete cascade,
  resultat_id  text not null,
  org_id       uuid not null references organizations(id),
  note_prestataire text,
  note_client      text,
  note_retenue     text not null,
  motif        text,
  decide_par   uuid,
  decide_at    timestamptz not null default now()
);

alter table arbitrages enable row level security;
create index if not exists idx_arbitrages_controle on arbitrages(controle_id);

-- Les policies d'arbitrages suivent exactement celles de controles :
-- à écrire sur le modèle des vôtres, elles ne sont pas devinables ici.

-- ------------------------------------------------------------
-- BLOC 4 — VÉRIFICATION
-- ------------------------------------------------------------

select
  (select count(*) from resultats where note_client is not null) as notations_client,
  (select count(*) from resultats where divergence)              as divergences,
  (select count(*) from controles where taux_retenu is null)     as controles_sans_taux_retenu;
