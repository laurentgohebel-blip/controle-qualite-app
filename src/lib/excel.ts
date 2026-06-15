import * as XLSX from 'xlsx';

// ========== IMPORT ==========

export function downloadTemplateSites() {
  const wb = XLSX.utils.book_new();
  const sitesSheet = XLSX.utils.json_to_sheet([
    { nom: 'Exemple Toulouse Nord', client: 'CCN Propreté', adresse: '123 Rue Exemple', ville: 'Toulouse', responsableSecteur: 'Jean Dupont', frequenceControle: 'Hebdomadaire', seuilCible: 90, emailClient: 'contact@client.fr' },
    { nom: 'Exemple Albi Centre', client: "Mairie d'Albi", adresse: '789 Avenue Test', ville: 'Albi', responsableSecteur: 'Marie Martin', frequenceControle: 'Mensuelle', seuilCible: 95, emailClient: '' },
  ]);
  const locauxSheet = XLSX.utils.json_to_sheet([
    { siteNom: 'Exemple Toulouse Nord', nom: 'Hall accueil', type: 'Circulation', surface: 50, etage: 'RDC' },
    { siteNom: 'Exemple Toulouse Nord', nom: 'Bureau direction', type: 'Bureau', surface: 25, etage: '1er' },
    { siteNom: 'Exemple Toulouse Nord', nom: 'Sanitaires H', type: 'Sanitaire', surface: 15, etage: 'RDC' },
    { siteNom: 'Exemple Albi Centre', nom: 'Salle conseil', type: 'Bureau', surface: 80, etage: 'RDC' },
  ]);
  XLSX.utils.book_append_sheet(wb, sitesSheet, 'Sites');
  XLSX.utils.book_append_sheet(wb, locauxSheet, 'Locaux');
  XLSX.writeFile(wb, 'template-import-sites.xlsx');
}

export type ImportPreview = {
  sites: { nom: string; client?: string; adresse?: string; ville?: string; responsableSecteur?: string; frequenceControle?: string; seuilCible?: number; emailClient?: string; isDuplicate: boolean }[];
  locaux: { siteNom: string; nom: string; type?: string; surface?: number; etage?: string; siteExists: boolean }[];
  errors: string[];
};

export async function parseImportFile(file: File, existingSites: any[]): Promise<ImportPreview> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf);
  const errors: string[] = [];

  const sitesRows = wb.Sheets['Sites'] ? XLSX.utils.sheet_to_json<any>(wb.Sheets['Sites']) : [];
  const locauxRows = wb.Sheets['Locaux'] ? XLSX.utils.sheet_to_json<any>(wb.Sheets['Locaux']) : [];

  if (!sitesRows.length && !locauxRows.length) errors.push('Aucune feuille "Sites" ou "Locaux" trouvée.');

  const existingNames = new Set(existingSites.map(s => s.nom.toLowerCase().trim()));
  const sites = sitesRows
    .filter(r => r.nom)
    .map(r => ({
      nom: String(r.nom).trim(),
      client: r.client ? String(r.client) : undefined,
      adresse: r.adresse ? String(r.adresse) : undefined,
      ville: r.ville ? String(r.ville) : undefined,
      responsableSecteur: r.responsableSecteur ? String(r.responsableSecteur) : undefined,
      frequenceControle: r.frequenceControle ? String(r.frequenceControle) : 'Hebdomadaire',
      seuilCible: r.seuilCible ? Number(r.seuilCible) : 90,
      emailClient: r.emailClient ? String(r.emailClient) : undefined,
      isDuplicate: existingNames.has(String(r.nom).toLowerCase().trim()),
    }));

  // pour les locaux, on vérifie que le siteNom existe (soit dans existing, soit dans import en cours)
  const allSiteNames = new Set([...existingNames, ...sites.map(s => s.nom.toLowerCase().trim())]);
  const locaux = locauxRows
    .filter(r => r.siteNom && r.nom)
    .map(r => ({
      siteNom: String(r.siteNom).trim(),
      nom: String(r.nom).trim(),
      type: r.type ? String(r.type) : 'Bureau',
      surface: r.surface ? Number(r.surface) : 0,
      etage: r.etage ? String(r.etage) : '',
      siteExists: allSiteNames.has(String(r.siteNom).toLowerCase().trim()),
    }));

  const orphanLocaux = locaux.filter(l => !l.siteExists);
  if (orphanLocaux.length) errors.push(`${orphanLocaux.length} local(aux) référencent un site qui n'existe pas et ne sera pas créé.`);

  return { sites, locaux, errors };
}


export function exportControlesExcel(opts: {
  controles: any[];
  sites: any[];
  agents: any[];
  resultats: any[];
  criteres: any[];
  locaux: any[];
  actions: any[];
}) {
  const { controles, sites, agents, resultats, criteres, locaux, actions } = opts;

  const getSite = (id: string) => sites.find(s => s.id === id);
  const getAgent = (id: string) => agents.find(a => a.id === id);
  const getCritere = (id: string) => criteres.find(c => c.id === id);
  const getLocal = (id: string) => locaux.find(l => l.id === id);

  // Feuille Contrôles
  const sheetControles = controles.map(c => ({
    Date: c.date,
    Type: c.type,
    Statut: c.statut,
    Site: getSite(c.siteId)?.nom || '',
    Ville: getSite(c.siteId)?.ville || '',
    Client: getSite(c.siteId)?.client || '',
    'Taux conformité (%)': c.tauxConformite ?? '',
    'Seuil cible (%)': getSite(c.siteId)?.seuilCible || '',
    'Agent évalué': (() => { const a = getAgent(c.agentEvalueId); return a ? `${a.prenom} ${a.nom}` : ''; })(),
    'Nb actions correctives': actions.filter((a: any) => a.controleId === c.id).length,
    Commentaire: c.commentaireGeneral || '',
  }));

  // Feuille Résultats
  const sheetResultats = resultats.map((r: any) => {
    const c = controles.find((x: any) => x.id === r.controleId);
    return {
      'Date contrôle': c?.date || '',
      Site: getSite(c?.siteId)?.nom || '',
      Local: getLocal(r.localId)?.nom || '',
      Critère: getCritere(r.critereId)?.libelle || '',
      Catégorie: getCritere(r.critereId)?.categorie || '',
      Coefficient: getCritere(r.critereId)?.coefficient || '',
      Note: r.note,
      Commentaire: r.commentaire || '',
      'Photo (URL)': r.photo || '',
    };
  });

  // Feuille Actions
  const sheetActions = actions.map((a: any) => {
    const c = controles.find((x: any) => x.id === a.controleId);
    return {
      'Date contrôle': c?.date || '',
      Site: getSite(c?.siteId)?.nom || '',
      Description: a.descriptionNc,
      Action: a.action,
      Responsable: (() => { const ag = getAgent(a.responsableId); return ag ? `${ag.prenom} ${ag.nom}` : ''; })(),
      Échéance: a.echeance,
      Statut: a.statut,
    };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheetControles), 'Contrôles');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheetResultats), 'Résultats');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheetActions), 'Actions');
  XLSX.writeFile(wb, `controles-qualite-${new Date().toISOString().split('T')[0]}.xlsx`);
}
