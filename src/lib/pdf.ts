import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportRapportMensuelPdf(opts: {
  site: any;
  month: string; // 'YYYY-MM'
  controles: any[];
  resultats: any[];
  actions: any[];
  agents: any[];
  criteres: any[];
}) {
  const { site, month, controles, resultats, actions, agents, criteres } = opts;
  const doc = new jsPDF();
  const monthLabel = new Date(month + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  doc.setFontSize(18);
  doc.text(`Rapport mensuel - ${site?.nom}`, 14, 18);
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(monthLabel, 14, 26);
  doc.setTextColor(0);

  const moy = controles.length
    ? Math.round(controles.reduce((s: number, c: any) => s + (c.tauxConformite ?? 0), 0) / controles.length)
    : 0;
  const actionsOuvertes = actions.filter((a: any) => a.statut !== 'Soldée').length;
  const actionsSoldees = actions.filter((a: any) => a.statut === 'Soldée').length;

  doc.setFontSize(11);
  doc.text(`Nombre de contrôles : ${controles.length}`, 14, 38);
  doc.text(`Taux moyen de conformité : ${moy}%`, 14, 45);
  doc.text(`Actions ouvertes : ${actionsOuvertes}    Actions soldées : ${actionsSoldees}`, 14, 52);

  autoTable(doc, {
    startY: 60,
    head: [['Date', 'Type', 'Taux', 'Statut', 'Agent', 'NC']],
    body: controles
      .sort((a: any, b: any) => a.date.localeCompare(b.date))
      .map((c: any) => {
        const ag = agents.find((a: any) => a.id === c.agentEvalueId);
        const nc = resultats.filter((r: any) => r.controleId === c.id && r.note === 'Non conforme').length;
        return [
          new Date(c.date).toLocaleDateString('fr-FR'),
          c.type,
          (c.tauxConformite ?? '-') + '%',
          c.statut,
          ag ? `${ag.prenom} ${ag.nom}` : '-',
          nc,
        ];
      }),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [37, 99, 235] },
  });

  // Top critères en échec sur le mois
  const counts = new Map<string, { total: number; ko: number }>();
  for (const r of resultats) {
    if (!r.critereId) continue;
    const c = counts.get(r.critereId) || { total: 0, ko: 0 };
    if (r.note !== 'Non applicable') c.total++;
    if (r.note === 'Non conforme' || r.note === 'Partiellement conforme') c.ko++;
    counts.set(r.critereId, c);
  }
  const top = Array.from(counts.entries())
    .map(([id, v]) => {
      const c = criteres.find((x: any) => x.id === id);
      return { libelle: c?.libelle || '-', total: v.total, ko: v.ko, taux: v.total ? Math.round((v.ko / v.total) * 100) : 0 };
    })
    .filter(x => x.total >= 2 && x.ko > 0)
    .sort((a, b) => b.taux - a.taux)
    .slice(0, 5);

  if (top.length) {
    const y = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(13);
    doc.text('Points faibles du mois', 14, y);
    autoTable(doc, {
      startY: y + 4,
      head: [['Critère', 'Échecs', '% échec']],
      body: top.map(t => [t.libelle, `${t.ko}/${t.total}`, t.taux + '%']),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [239, 68, 68] },
    });
  }

  doc.save(`rapport-${site?.nom}-${month}.pdf`);
}

async function urlToDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch { return null; }
}

export async function exportControlePdf(opts: {
  controle: any;
  site: any;
  agent: any;
  resultats: any[];
  actions: any[];
  criteres: any[];
  locaux: any[];
}) {
  const { controle, site, agent, resultats, actions, criteres, locaux } = opts;
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text('Rapport de contrôle qualité', 14, 18);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Site : ${site?.nom || ''}`, 14, 28);
  doc.text(`Date : ${new Date(controle.date).toLocaleDateString('fr-FR')}`, 14, 34);
  doc.text(`Type : ${controle.type}`, 14, 40);
  doc.text(`Agent évalué : ${agent ? `${agent.prenom} ${agent.nom}` : '-'}`, 14, 46);
  doc.setTextColor(0);
  doc.setFontSize(14);
  const taux = controle.tauxConformite ?? 0;
  doc.setTextColor(taux >= (site?.seuilCible || 90) ? 16 : 220, taux >= (site?.seuilCible || 90) ? 185 : 38, taux >= (site?.seuilCible || 90) ? 129 : 38);
  doc.text(`Taux de conformité : ${taux}%`, 14, 56);
  doc.setTextColor(0);

  autoTable(doc, {
    startY: 64,
    head: [['Local', 'Critère', 'Note', 'Commentaire']],
    body: resultats.map((r: any) => {
      const c = criteres.find((x: any) => x.id === r.critereId);
      const l = locaux.find((x: any) => x.id === r.localId);
      return [l?.nom || '-', c?.libelle || '-', r.note, r.commentaire || ''];
    }),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [37, 99, 235] },
  });

  if (actions.length) {
    const y = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(13);
    doc.text('Actions correctives', 14, y);
    autoTable(doc, {
      startY: y + 4,
      head: [['Description', 'Action', 'Échéance', 'Statut']],
      body: actions.map((a: any) => [
        a.descriptionNc, a.action,
        new Date(a.echeance).toLocaleDateString('fr-FR'),
        a.statut,
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [239, 68, 68] },
    });
  }

  if (controle.commentaireGeneral) {
    const y = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.text('Commentaire général :', 14, y);
    doc.setFontSize(10);
    doc.text(doc.splitTextToSize(controle.commentaireGeneral, 180), 14, y + 6);
  }

  // Photos des résultats non conformes
  const photoResultats = resultats.filter((r: any) => r.photo);
  if (photoResultats.length) {
    doc.addPage();
    doc.setFontSize(14);
    doc.text('Photos jointes', 14, 18);
    let x = 14, y = 28;
    for (const r of photoResultats) {
      const dataUrl = await urlToDataUrl(r.photo);
      if (!dataUrl) continue;
      const c = criteres.find((x: any) => x.id === r.critereId);
      const l = locaux.find((x: any) => x.id === r.localId);
      try {
        doc.addImage(dataUrl, 'JPEG', x, y, 60, 45);
      } catch { continue; }
      doc.setFontSize(8);
      doc.text(`${l?.nom || ''} - ${c?.libelle || ''}`, x, y + 50, { maxWidth: 60 });
      doc.text(`Note: ${r.note}`, x, y + 58);
      x += 70;
      if (x > 140) { x = 14; y += 70; }
      if (y > 230) { doc.addPage(); x = 14; y = 18; }
    }
  }

  if (controle.signatureControleur || controle.signatureAgent) {
    doc.addPage();
    const y = 20;
    doc.setFontSize(14);
    doc.text('Signatures', 14, y);
    if (controle.signatureControleur) {
      doc.setFontSize(10);
      doc.text('Contrôleur', 14, y + 12);
      doc.addImage(controle.signatureControleur, 'PNG', 14, y + 16, 80, 30);
    }
    if (controle.signatureAgent) {
      doc.setFontSize(10);
      doc.text('Agent évalué', 110, y + 12);
      doc.addImage(controle.signatureAgent, 'PNG', 110, y + 16, 80, 30);
    }
  }

  doc.save(`controle-${site?.nom || 'site'}-${controle.date}.pdf`);
}
