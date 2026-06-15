// Packs de critères standard prêts à l'emploi

export type CriterePack = {
  libelle: string;
  categorie: string;
  coefficient: number;
  typeLocal: string[];
};

export const PACK_CCN_PROPRETE: CriterePack[] = [
  // Sols
  { libelle: 'Aspiration / balayage humide', categorie: 'Sols', coefficient: 3, typeLocal: ['Bureau', 'Circulation', 'Vestiaire', 'Cuisine/Office'] },
  { libelle: 'Absence de traces et taches', categorie: 'Sols', coefficient: 3, typeLocal: ['Bureau', 'Circulation', 'Sanitaire', 'Cuisine/Office'] },
  { libelle: 'Plinthes nettoyées', categorie: 'Sols', coefficient: 2, typeLocal: ['Bureau', 'Sanitaire', 'Cuisine/Office'] },
  { libelle: 'Coins et recoins traités', categorie: 'Sols', coefficient: 2, typeLocal: ['Bureau', 'Sanitaire', 'Circulation'] },

  // Sanitaires
  { libelle: 'Cuvettes et urinoirs propres', categorie: 'Sanitaires', coefficient: 3, typeLocal: ['Sanitaire'] },
  { libelle: 'Lavabos et miroirs', categorie: 'Sanitaires', coefficient: 3, typeLocal: ['Sanitaire'] },
  { libelle: 'Désinfection visible et tracée', categorie: 'Sanitaires', coefficient: 3, typeLocal: ['Sanitaire'] },
  { libelle: 'Absence d\'odeurs', categorie: 'Sanitaires', coefficient: 3, typeLocal: ['Sanitaire'] },
  { libelle: 'Joints et carrelages propres', categorie: 'Sanitaires', coefficient: 2, typeLocal: ['Sanitaire'] },

  // Surfaces
  { libelle: 'Dépoussiérage bureaux et postes', categorie: 'Surfaces', coefficient: 2, typeLocal: ['Bureau', 'Cuisine/Office'] },
  { libelle: 'Dessus de meubles', categorie: 'Surfaces', coefficient: 2, typeLocal: ['Bureau', 'Cuisine/Office', 'Vestiaire'] },
  { libelle: 'Interrupteurs et poignées', categorie: 'Surfaces', coefficient: 2, typeLocal: ['Bureau', 'Circulation', 'Sanitaire'] },
  { libelle: 'Plans de travail nettoyés', categorie: 'Surfaces', coefficient: 3, typeLocal: ['Cuisine/Office'] },

  // Poussières
  { libelle: 'Hautes surfaces (au-dessus de 1.80 m)', categorie: 'Poussières', coefficient: 1, typeLocal: ['Bureau', 'Circulation'] },
  { libelle: 'Grilles d\'aération', categorie: 'Poussières', coefficient: 1, typeLocal: ['Bureau', 'Sanitaire', 'Cuisine/Office'] },
  { libelle: 'Radiateurs et convecteurs', categorie: 'Poussières', coefficient: 1, typeLocal: ['Bureau', 'Circulation'] },

  // Déchets
  { libelle: 'Vidage des corbeilles', categorie: 'Déchets', coefficient: 2, typeLocal: ['Bureau', 'Circulation', 'Sanitaire', 'Cuisine/Office'] },
  { libelle: 'Changement de sacs', categorie: 'Déchets', coefficient: 2, typeLocal: ['Bureau', 'Circulation', 'Sanitaire', 'Cuisine/Office'] },
  { libelle: 'Conteneurs lavés et désinfectés', categorie: 'Déchets', coefficient: 1, typeLocal: ['Cuisine/Office', 'Sanitaire'] },

  // Vitrerie
  { libelle: 'Vitres intérieures', categorie: 'Vitrerie', coefficient: 2, typeLocal: ['Bureau', 'Circulation'] },
  { libelle: 'Portes vitrées et cloisons', categorie: 'Vitrerie', coefficient: 2, typeLocal: ['Bureau', 'Circulation'] },

  // Consommables
  { libelle: 'Papier WC réapprovisionné', categorie: 'Approvisionnement consommables', coefficient: 1, typeLocal: ['Sanitaire'] },
  { libelle: 'Essuie-mains disponibles', categorie: 'Approvisionnement consommables', coefficient: 1, typeLocal: ['Sanitaire', 'Cuisine/Office'] },
  { libelle: 'Savon disponible', categorie: 'Approvisionnement consommables', coefficient: 1, typeLocal: ['Sanitaire', 'Cuisine/Office'] },
];

export const PACKS: Record<string, { label: string; description: string; criteres: CriterePack[] }> = {
  ccn: {
    label: 'Pack CCN Propreté (24 critères)',
    description: 'Référentiel standard du secteur propreté : sols, sanitaires, surfaces, poussières, déchets, vitrerie, consommables.',
    criteres: PACK_CCN_PROPRETE,
  },
};
