// ============================================================
// Moteur de calcul du taux de conformité — piloté par la config
// Remplace calculateTauxConformite() (App.tsx:541).
// ============================================================

import type { SectorConfig, Criticite } from './sectorConfig';
import { CONFIG_PROPRETE } from './sectorConfig';

/** Un résultat tel qu'il arrive du moteur. Les champs dénormalisés
 *  (coefficient, critereLibelle) sont prioritaires : ce sont eux qui
 *  donnent au contrôle sa valeur probante une fois le critère modifié. */
export interface ResultatScorable {
  critereId: string;
  localId?: string | null;
  note: string;
  coefficient?: number | null;
  critereLibelle?: string | null;
  criticite?: Criticite | null;
}

export interface CritereRef {
  id: string;
  libelle: string;
  coefficient: number;
  criticite?: Criticite | null;
}

export interface OptionsScoring {
  /** Que faire d'un résultat dont le critère est introuvable ET non dénormalisé.
   *  'ignorer'  — comportement historique : la ligne disparaît des deux sommes.
   *  'signaler' — même calcul, mais l'anomalie remonte dans le diagnostic (défaut).
   *  'echouer'  — lève une erreur : à utiliser pour la génération de PDF contractuel. */
  politiqueOrphelin?: 'ignorer' | 'signaler' | 'echouer';
}

export interface DiagnosticScoring {
  taux: number;
  /** Lignes prises en compte au dénominateur. */
  retenus: number;
  /** Lignes exclues par un échelon « exclu » (Non applicable). */
  exclus: number;
  /** Critère introuvable et coefficient non dénormalisé : donnée perdue. */
  orphelins: string[];
  /** Échelon de note absent de la config : donnée incohérente. */
  notesInconnues: string[];
  /** Zones annulées par une non-conformité bloquante. */
  zonesBloquees: string[];
}

/**
 * Calcule le taux de conformité d'un contrôle.
 *
 * Formule : Σ(valeur_note × coefficient) / Σ(coefficient) × 100
 * Les échelons marqués `exclu` sortent du numérateur et du dénominateur.
 */
export function calculerTaux(
  resultats: ResultatScorable[],
  config: SectorConfig = CONFIG_PROPRETE,
  criteres: CritereRef[] = [],
  options: OptionsScoring = {}
): DiagnosticScoring {
  const politique = options.politiqueOrphelin ?? 'signaler';

  const diag: DiagnosticScoring = {
    taux: 0, retenus: 0, exclus: 0,
    orphelins: [], notesInconnues: [], zonesBloquees: [],
  };

  if (resultats.length === 0) return diag;

  const echelons = new Map(config.notes.map(n => [n.cle, n]));
  const indexCriteres = new Map(criteres.map(c => [c.id, c]));
  const { criticiteBloquanteActive, poidsCriticiteMajeure } = config.scoring;

  // Regroupement par zone : la criticité bloquante s'applique au périmètre
  // de la zone, pas au contrôle entier.
  type Ligne = { zone: string; poids: number; valeur: number; bloque: boolean };
  const lignes: Ligne[] = [];

  for (const r of resultats) {
    const echelon = echelons.get(r.note);
    if (!echelon) {
      if (!diag.notesInconnues.includes(r.note)) diag.notesInconnues.push(r.note);
      continue;
    }
    if (echelon.exclu) { diag.exclus++; continue; }

    // Le coefficient dénormalisé fait foi. À défaut seulement, on résout.
    const critere = indexCriteres.get(r.critereId);
    const coefficient = r.coefficient ?? critere?.coefficient ?? null;

    if (coefficient === null) {
      if (politique === 'echouer') {
        throw new Error(
          `Critère ${r.critereId} introuvable et non dénormalisé : ` +
          `le taux ne peut pas être recalculé de façon fiable.`
        );
      }
      if (politique === 'signaler') diag.orphelins.push(r.critereId);
      continue; // 'ignorer' = comportement historique
    }

    const criticite = r.criticite ?? critere?.criticite ?? 'normale';
    const poids = criticite === 'majeure'
      ? coefficient * poidsCriticiteMajeure
      : coefficient;

    lignes.push({
      zone: r.localId ?? '__global__',
      poids,
      valeur: echelon.valeur,
      bloque: criticiteBloquanteActive && criticite === 'bloquante' && echelon.valeur === 0,
    });
  }

  const zonesBloquees = new Set(lignes.filter(l => l.bloque).map(l => l.zone));
  diag.zonesBloquees = [...zonesBloquees];

  let numerateur = 0;
  let denominateur = 0;
  for (const l of lignes) {
    denominateur += l.poids;
    numerateur += zonesBloquees.has(l.zone) ? 0 : l.valeur * l.poids;
  }

  diag.retenus = lignes.length;
  if (denominateur === 0) return diag;

  const brut = (numerateur / denominateur) * 100;
  diag.taux = config.scoring.arrondi === 'dixieme'
    ? Math.round(brut * 10) / 10
    : Math.round(brut);

  return diag;
}

/** Raccourci compatible avec l'appel historique, qui ne renvoyait qu'un nombre. */
export function calculerTauxSimple(
  resultats: ResultatScorable[],
  config: SectorConfig = CONFIG_PROPRETE,
  criteres: CritereRef[] = []
): number {
  return calculerTaux(resultats, config, criteres, { politiqueOrphelin: 'ignorer' }).taux;
}

// ============================================================
// Contrôle contradictoire : deux notations sur un même relevé
// ============================================================

export interface ResultatContradictoire extends ResultatScorable {
  /** Notation de la partie adverse. Absente = pas de contradictoire sur ce critère. */
  noteClient?: string | null;
  /** Note déjà tranchée par un arbitrage explicite. Prioritaire sur la règle. */
  noteRetenue?: string | null;
}

export interface DiagnosticContradictoire {
  /** Taux tel que le prestataire l'a noté. */
  tauxPrestataire: number;
  /** Taux tel que le client l'a noté, sur les seuls critères qu'il a notés. */
  tauxClient: number | null;
  /** Taux contractuel, après application de la règle d'arbitrage. */
  tauxRetenu: number;
  /** Critères où les deux parties ne sont pas d'accord. */
  divergences: Array<{
    critereId: string;
    notePrestataire: string;
    noteClient: string;
    ecartEchelons: number;
    arbitrageRequis: boolean;
  }>;
  /** true si au moins un critère exige un arbitrage humain avant clôture. */
  bloqueParArbitrage: boolean;
}

/**
 * Calcule les deux taux et la liste des divergences.
 * La règle d'arbitrage vient de la config : ce moteur ne décide rien tout seul.
 */
export function calculerContradictoire(
  resultats: ResultatContradictoire[],
  config: SectorConfig = CONFIG_PROPRETE,
  criteres: CritereRef[] = []
): DiagnosticContradictoire {
  const regles = config.contradictoire;
  const rang = new Map(config.notes.map((n, i) => [n.cle, i]));
  const valeur = new Map(config.notes.map(n => [n.cle, n]));

  const divergences: DiagnosticContradictoire['divergences'] = [];
  let bloque = false;

  const retenus: ResultatScorable[] = resultats.map(r => {
    const nc = r.noteClient;
    if (!regles.actif || !nc || nc === r.note) {
      return Object.assign({}, r, { note: r.noteRetenue ?? r.note });
    }

    const ecart = Math.abs((rang.get(nc) ?? 0) - (rang.get(r.note) ?? 0));
    const requis =
      regles.arbitrage === 'manuel' ||
      (regles.seuilArbitrageObligatoire > 0 && ecart >= regles.seuilArbitrageObligatoire);

    divergences.push({
      critereId: r.critereId,
      notePrestataire: r.note,
      noteClient: nc,
      ecartEchelons: ecart,
      arbitrageRequis: requis && !r.noteRetenue,
    });
    if (requis && !r.noteRetenue) bloque = true;

    // Un arbitrage déjà rendu l'emporte toujours sur la règle automatique.
    if (r.noteRetenue) return Object.assign({}, r, { note: r.noteRetenue });

    let note = r.note;
    if (regles.arbitrage === 'client') note = nc;
    else if (regles.arbitrage === 'defavorable') {
      const vp = valeur.get(r.note)?.valeur ?? 0;
      const vc = valeur.get(nc)?.valeur ?? 0;
      note = vc < vp ? nc : r.note;
    } else if (regles.arbitrage === 'moyenne') {
      // Échelon dont la valeur est la plus proche de la moyenne des deux.
      const cible = ((valeur.get(r.note)?.valeur ?? 0) + (valeur.get(nc)?.valeur ?? 0)) / 2;
      const candidats = config.notes.filter(n => !n.exclu);
      note = candidats.reduce((a, b) =>
        Math.abs(b.valeur - cible) < Math.abs(a.valeur - cible) ? b : a
      ).cle;
    }
    return Object.assign({}, r, { note });
  });

  const cotePrestataire = resultats.map(r => Object.assign({}, r, { note: r.note }));
  const coteClient = resultats
    .filter(r => r.noteClient)
    .map(r => Object.assign({}, r, { note: r.noteClient as string }));

  return {
    tauxPrestataire: calculerTaux(cotePrestataire, config, criteres).taux,
    tauxClient: coteClient.length ? calculerTaux(coteClient, config, criteres).taux : null,
    tauxRetenu: calculerTaux(retenus, config, criteres).taux,
    divergences,
    bloqueParArbitrage: bloque,
  };
}
