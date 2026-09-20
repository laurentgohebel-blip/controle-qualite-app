// Rejeu : le nouveau moteur doit reproduire l'ancien à l'identique
// sur le secteur propreté, sur des milliers de contrôles aléatoires.

import { CONFIG_PROPRETE, CONFIG_RESTAURATION } from './src/lib/sectorConfig.ts';
import { calculerTaux, calculerTauxSimple } from './src/lib/scoring.ts';

// ---------- Implémentation historique (App.tsx:541), copiée telle quelle ----------
const NOTE_SCORES: Record<string, number> = {
  'Conforme': 1, 'Partiellement conforme': 0.5, 'Non conforme': 0, 'Non applicable': 0,
};
function ancienCalcul(resultats: any[], criteres: any[]): number {
  if (resultats.length === 0) return 0;
  let sommePonderee = 0, sommeMaxPossible = 0;
  for (const r of resultats) {
    const c = criteres.find(cr => cr.id === r.critereId);
    if (!c || r.note === 'Non applicable') continue;
    sommePonderee += NOTE_SCORES[r.note] * c.coefficient;
    sommeMaxPossible += c.coefficient;
  }
  if (sommeMaxPossible === 0) return 0;
  return Math.round((sommePonderee / sommeMaxPossible) * 100);
}

// ---------- Générateur pseudo-aléatoire déterministe ----------
let seed = 42;
const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const pick = <T,>(a: T[]): T => a[Math.floor(rnd() * a.length)];

const NOTES = ['Conforme', 'Partiellement conforme', 'Non conforme', 'Non applicable'];
const criteres = Array.from({ length: 24 }, (_, i) => ({
  id: `c${i}`, libelle: `Critère ${i}`, coefficient: pick([1, 2, 3]),
}));

let ecarts = 0, cas = 0;
for (let n = 0; n < 5000; n++) {
  const nbLignes = 1 + Math.floor(rnd() * 40);
  const resultats = Array.from({ length: nbLignes }, () => {
    const c = pick(criteres);
    return { critereId: c.id, localId: `z${Math.floor(rnd() * 4)}`, note: pick(NOTES) };
  });
  const ancien = ancienCalcul(resultats, criteres);
  const nouveau = calculerTauxSimple(resultats, CONFIG_PROPRETE, criteres);
  cas++;
  if (ancien !== nouveau) {
    ecarts++;
    if (ecarts <= 3) console.log(`  écart : ancien=${ancien} nouveau=${nouveau}`);
  }
}
console.log(`\n[1] Non-régression propreté : ${cas - ecarts}/${cas} identiques` + (ecarts ? ` — ${ecarts} ÉCARTS` : ' ✓'));

// ---------- [2] Le cas du critère supprimé ----------
const resPerdus = [
  { critereId: 'c0', note: 'Conforme' },
  { critereId: 'SUPPRIME', note: 'Non conforme' },
  { critereId: 'c1', note: 'Conforme' },
];
console.log(`\n[2] Critère supprimé, sans dénormalisation :`);
console.log(`    ancien moteur      : ${ancienCalcul(resPerdus, criteres)} %  (la NC disparaît en silence)`);
const d = calculerTaux(resPerdus, CONFIG_PROPRETE, criteres);
console.log(`    nouveau, signalé   : ${d.taux} %  orphelins=${JSON.stringify(d.orphelins)}`);
const resFiges = [
  { critereId: 'c0', note: 'Conforme', coefficient: 2 },
  { critereId: 'SUPPRIME', note: 'Non conforme', coefficient: 3 },
  { critereId: 'c1', note: 'Conforme', coefficient: 2 },
];
console.log(`    avec coefficient figé : ${calculerTaux(resFiges, CONFIG_PROPRETE, criteres).taux} %  (valeur probante préservée)`);
try {
  calculerTaux(resPerdus, CONFIG_PROPRETE, criteres, { politiqueOrphelin: 'echouer' });
} catch (e: any) {
  console.log(`    politique 'echouer' : ${e.message.slice(0, 60)}…`);
}

// ---------- [3] Note inconnue ----------
const resNoteInconnue = [{ critereId: 'c0', note: 'Ecart majeur' }];
console.log(`\n[3] Note absente de la config :`);
console.log(`    ancien moteur : ${ancienCalcul(resNoteInconnue, criteres)}  (NaN silencieux)`);
const d3 = calculerTaux(resNoteInconnue, CONFIG_PROPRETE, criteres);
console.log(`    nouveau       : ${d3.taux} %  notesInconnues=${JSON.stringify(d3.notesInconnues)}`);

// ---------- [4] Second secteur : échelle à 5 niveaux + criticité bloquante ----------
const criteresHaccp = [
  { id: 'h1', libelle: 'Température enceinte', coefficient: 3, criticite: 'bloquante' as const },
  { id: 'h2', libelle: 'Traçabilité lots', coefficient: 2, criticite: 'majeure' as const },
  { id: 'h3', libelle: 'Tenue du personnel', coefficient: 1, criticite: 'normale' as const },
];
const auditOk = [
  { critereId: 'h1', localId: 'froid', note: 'Conforme' },
  { critereId: 'h2', localId: 'froid', note: 'Ecart mineur' },
  { critereId: 'h3', localId: 'plonge', note: 'Ecart majeur' },
];
const auditKo = [...auditOk.map(r => ({ ...r }))];
auditKo[0].note = 'Non conforme';
console.log(`\n[4] Secteur restauration, même moteur :`);
console.log(`    audit sain                 : ${calculerTaux(auditOk, CONFIG_RESTAURATION, criteresHaccp).taux} %`);
const dKo = calculerTaux(auditKo, CONFIG_RESTAURATION, criteresHaccp);
console.log(`    NC bloquante sur le froid  : ${dKo.taux} %  zonesBloquees=${JSON.stringify(dKo.zonesBloquees)}`);
console.log(`    (la zone plonge reste comptée, elle n'est pas concernée)\n`);

// ---------- [5] Contradictoire : deux notations, un seul taux contractuel ----------
import { calculerContradictoire } from './src/lib/scoring.ts';

const relevé = [
  { critereId: 'c0', localId: 'z1', note: 'Conforme', noteClient: 'Conforme' },
  { critereId: 'c1', localId: 'z1', note: 'Conforme', noteClient: 'Partiellement conforme' },
  { critereId: 'c2', localId: 'z1', note: 'Partiellement conforme', noteClient: 'Non conforme' },
  { critereId: 'c3', localId: 'z1', note: 'Conforme' }
];
const critRef = [
  { id: 'c0', libelle: 'A', coefficient: 3 },
  { id: 'c1', libelle: 'B', coefficient: 3 },
  { id: 'c2', libelle: 'C', coefficient: 2 },
  { id: 'c3', libelle: 'D', coefficient: 2 }
];

const inactif = calculerContradictoire(relevé, CONFIG_PROPRETE, critRef);
console.log(`\n[5] Contradictoire désactivé (config propreté livrée) :`);
console.log(`    prestataire ${inactif.tauxPrestataire} %, client ${inactif.tauxClient} %, retenu ${inactif.tauxRetenu} %`);
console.log(`    divergences comptées : ${inactif.divergences.length}  (le moteur ne touche à rien)`);

const cfgDefavorable = { ...CONFIG_PROPRETE, contradictoire: { actif: true, arbitrage: 'defavorable' as const, seuilArbitrageObligatoire: 0 } };
const d5 = calculerContradictoire(relevé, cfgDefavorable, critRef);
console.log(`\n    règle « la plus défavorable » :`);
console.log(`    prestataire ${d5.tauxPrestataire} %, client ${d5.tauxClient} %, retenu ${d5.tauxRetenu} %`);
console.log(`    ${d5.divergences.length} divergences, blocage arbitrage : ${d5.bloqueParArbitrage}`);

const cfgManuel = { ...CONFIG_PROPRETE, contradictoire: { actif: true, arbitrage: 'manuel' as const, seuilArbitrageObligatoire: 0 } };
const d6 = calculerContradictoire(relevé, cfgManuel, critRef);
console.log(`\n    règle « arbitrage manuel » : clôture bloquée = ${d6.bloqueParArbitrage}`);
const arbitré = relevé.map(r => r.critereId === 'c1' ? { ...r, noteRetenue: 'Conforme' } : (r.critereId === 'c2' ? { ...r, noteRetenue: 'Non conforme' } : r));
const d7 = calculerContradictoire(arbitré, cfgManuel, critRef);
console.log(`    après arbitrage des deux écarts : retenu ${d7.tauxRetenu} %, bloqué = ${d7.bloqueParArbitrage}\n`);
