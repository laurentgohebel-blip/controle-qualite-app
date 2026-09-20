// ============================================================
// Couche de configuration sectorielle — versionnée
// Toute règle métier propre à un secteur vit ici, jamais dans le code.
// ============================================================

/** Un échelon de l'échelle de notation. */
export interface EchelonNote {
  /** Valeur stockée en base dans resultats.note. Ne JAMAIS la modifier :
   *  les contrôles historiques la référencent. Pour changer un libellé,
   *  garder la clé et publier une nouvelle version de config. */
  cle: string;
  libelle: string;
  /** Poids dans le numérateur, normalisé entre 0 et 1. */
  valeur: number;
  /** Si true, l'échelon est exclu du numérateur ET du dénominateur
   *  (cas du « Non applicable » : ne pénalise pas, ne compte pas). */
  exclu: boolean;
  couleur: string;
  /** Marque courte affichée dans la pastille : double la couleur pour les daltoniens. */
  lettre?: string;
  /** Libellé compact pour la barre de notation, où la place manque. */
  abrege?: string;
  /** Si true, une note à cet échelon appelle une action corrective. */
  declencheAction?: boolean;
}

/** Niveau de criticité d'un critère. */
export type Criticite = 'normale' | 'majeure' | 'bloquante';

/** Un attribut libre porté par une zone (ex-« local »). */
export interface AttributZone {
  cle: string;
  libelle: string;
  type: 'texte' | 'nombre' | 'liste';
  options?: string[];
  unite?: string;
}

export interface TypeZone {
  cle: string;
  libelle: string;
}

/** Vocabulaire d'interface. Permet de parler « véhicule » ou « équipement »
 *  sans renommer une seule table. */
export interface Vocabulaire {
  zone: string;
  zones: string;
  critere: string;
  criteres: string;
  agent: string;
  agents: string;
  controle: string;
  controles: string;
  site: string;
  sites: string;
}

export interface ReglesScoring {
  /** Moyenne pondérée par coefficient. Seule méthode implémentée à ce jour. */
  methode: 'moyenne_ponderee';
  /** Arrondi du taux final. */
  arrondi: 'entier' | 'dixieme';
  /** Seuil de conformité proposé par défaut à la création d'un site. */
  seuilCibleDefaut: number;
  /** Si true, un critère « bloquante » noté au plus bas met le taux
   *  de sa zone à 0, quelle que soit la note des autres critères.
   *  HACCP, sécurité incendie, contrôle réglementaire.
   *  Laisser à false pour reproduire le comportement propreté historique. */
  criticiteBloquanteActive: boolean;
  /** Multiplicateur appliqué au coefficient d'un critère « majeure ». */
  poidsCriticiteMajeure: number;
}

/** Règle appliquée quand les deux parties ne notent pas pareil. */
export type ModeArbitrage = 'prestataire' | 'client' | 'moyenne' | 'defavorable' | 'manuel';

export interface ReglesContradictoire {
  /** false : notation simple, comportement historique. */
  actif: boolean;
  /** Ce que devient la note retenue en cas de divergence.
   *  'defavorable' prend systématiquement la plus basse des deux.
   *  'manuel' laisse le contrôle bloqué jusqu'à arbitrage explicite. */
  arbitrage: ModeArbitrage;
  /** Écart, en nombre d'échelons, au-delà duquel un arbitrage est exigé
   *  même si la règle automatique pourrait trancher. 0 désactive le garde-fou. */
  seuilArbitrageObligatoire: number;
}

export interface SectorConfig {
  /** Incrémentée à CHAQUE modification. Recopiée dans controles.config_version. */
  version: number;
  secteur: string;
  libelle: string;
  vocabulaire: Vocabulaire;
  notes: EchelonNote[];
  typesZone: TypeZone[];
  attributsZone: AttributZone[];
  typesControle: string[];
  frequences: string[];
  categories: string[];
  scoring: ReglesScoring;
  contradictoire: ReglesContradictoire;
}

// ============================================================
// Secteur propreté — reproduit à l'identique le comportement actuel
// ============================================================

export const CONFIG_PROPRETE: SectorConfig = {
  version: 1,
  secteur: 'proprete',
  libelle: 'Propreté / facility management',

  vocabulaire: {
    zone: 'Local', zones: 'Locaux',
    critere: 'Critère', criteres: 'Critères',
    agent: 'Agent', agents: 'Agents',
    controle: 'Contrôle', controles: 'Contrôles',
    site: 'Site', sites: 'Sites',
  },

  notes: [
    { cle: 'Conforme', libelle: 'Conforme', valeur: 1, exclu: false, couleur: 'bg-note-conforme', lettre: 'C', abrege: 'Conforme' },
    { cle: 'Partiellement conforme', libelle: 'Partiellement conforme', valeur: 0.5, exclu: false, couleur: 'bg-note-partiel', lettre: 'P', abrege: 'Partiel', declencheAction: true },
    { cle: 'Non conforme', libelle: 'Non conforme', valeur: 0, exclu: false, couleur: 'bg-note-nc', lettre: 'N', abrege: 'Non conforme', declencheAction: true },
    { cle: 'Non applicable', libelle: 'Non applicable', valeur: 0, exclu: true, couleur: 'bg-note-sansobjet', lettre: '—', abrege: 'Sans objet' },
  ],

  typesZone: [
    { cle: 'Bureau', libelle: 'Bureau' },
    { cle: 'Sanitaire', libelle: 'Sanitaire' },
    { cle: 'Circulation', libelle: 'Circulation' },
    { cle: 'Vestiaire', libelle: 'Vestiaire' },
    { cle: 'Cuisine/Office', libelle: 'Cuisine / Office' },
  ],

  attributsZone: [
    { cle: 'surface', libelle: 'Surface', type: 'nombre', unite: 'm²' },
    { cle: 'etage', libelle: 'Étage', type: 'texte' },
  ],

  typesControle: ['Programmé', 'Inopiné', 'Contradictoire client'],
  frequences: ['Hebdomadaire', 'Mensuelle'],
  categories: ['Sols', 'Sanitaires', 'Surfaces', 'Poussières', 'Déchets', 'Vitrerie', 'Approvisionnement consommables'],

  scoring: {
    methode: 'moyenne_ponderee',
    arrondi: 'entier',
    seuilCibleDefaut: 90,
    criticiteBloquanteActive: false,
    poidsCriticiteMajeure: 1,
  },

  contradictoire: {
    actif: false,
    arbitrage: 'prestataire',
    seuilArbitrageObligatoire: 0,
  },
};

// ============================================================
// Exemple de second secteur — preuve que la couche tient
// ============================================================

export const CONFIG_RESTAURATION: SectorConfig = {
  version: 1,
  secteur: 'restauration',
  libelle: 'Restauration collective / HACCP',

  vocabulaire: {
    zone: 'Poste', zones: 'Postes',
    critere: 'Point de contrôle', criteres: 'Points de contrôle',
    agent: 'Responsable', agents: 'Responsables',
    controle: 'Audit', controles: 'Audits',
    site: 'Établissement', sites: 'Établissements',
  },

  notes: [
    { cle: 'Conforme', libelle: 'Conforme', valeur: 1, exclu: false, couleur: 'bg-note-conforme', lettre: 'C', abrege: 'Conforme' },
    { cle: 'Ecart mineur', libelle: 'Écart mineur', valeur: 0.66, exclu: false, couleur: 'bg-note-partiel', lettre: 'm', abrege: 'Mineur', declencheAction: true },
    { cle: 'Ecart majeur', libelle: 'Écart majeur', valeur: 0.33, exclu: false, couleur: 'bg-note-alerte', lettre: 'M', abrege: 'Majeur', declencheAction: true },
    { cle: 'Non conforme', libelle: 'Non conformité critique', valeur: 0, exclu: false, couleur: 'bg-note-nc', lettre: 'N', abrege: 'Critique', declencheAction: true },
    { cle: 'Non applicable', libelle: 'Non applicable', valeur: 0, exclu: true, couleur: 'bg-note-sansobjet', lettre: '—', abrege: 'Sans objet' },
  ],

  typesZone: [
    { cle: 'Reception', libelle: 'Réception marchandises' },
    { cle: 'Stockage froid', libelle: 'Stockage froid' },
    { cle: 'Preparation', libelle: 'Préparation' },
    { cle: 'Cuisson', libelle: 'Cuisson' },
    { cle: 'Distribution', libelle: 'Distribution' },
    { cle: 'Plonge', libelle: 'Plonge' },
  ],

  attributsZone: [
    { cle: 'temperature_cible', libelle: 'Température cible', type: 'nombre', unite: '°C' },
    { cle: 'equipement', libelle: 'Équipement', type: 'texte' },
  ],

  typesControle: ['Autocontrôle', 'Audit interne', 'Audit contradictoire client', 'Inopiné'],
  frequences: ['Quotidienne', 'Hebdomadaire', 'Mensuelle'],
  categories: ['Températures', 'Traçabilité', 'Hygiène du personnel', 'Nettoyage', 'Stockage', 'Marche en avant'],

  scoring: {
    methode: 'moyenne_ponderee',
    arrondi: 'entier',
    seuilCibleDefaut: 95,
    criticiteBloquanteActive: true,
    poidsCriticiteMajeure: 2,
  },

  contradictoire: {
    actif: true,
    arbitrage: 'defavorable',
    seuilArbitrageObligatoire: 2,
  },
};

export const CONFIGS: Record<string, SectorConfig> = {
  proprete: CONFIG_PROPRETE,
  restauration: CONFIG_RESTAURATION,
};

export function getConfig(secteur: string | null | undefined): SectorConfig {
  return (secteur && CONFIGS[secteur]) || CONFIG_PROPRETE;
}
