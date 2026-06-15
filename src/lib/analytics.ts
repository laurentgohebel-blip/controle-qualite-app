// Calculs BI réutilisables

export function tauxMoyenPeriode(controles: any[], months: number): number {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  const inRange = controles.filter(c => c.tauxConformite !== null && new Date(c.date) >= cutoff);
  if (!inRange.length) return 0;
  return Math.round(inRange.reduce((s, c) => s + c.tauxConformite, 0) / inRange.length);
}

export function topCriteresEnEchec(resultats: any[], criteres: any[], n = 10) {
  const counts = new Map<string, { total: number; ko: number }>();
  for (const r of resultats) {
    if (!r.critereId) continue;
    const c = counts.get(r.critereId) || { total: 0, ko: 0 };
    if (r.note !== 'Non applicable') c.total++;
    if (r.note === 'Non conforme' || r.note === 'Partiellement conforme') c.ko++;
    counts.set(r.critereId, c);
  }
  const arr = Array.from(counts.entries()).map(([id, v]) => {
    const c = criteres.find((x: any) => x.id === id);
    return {
      libelle: c?.libelle || 'Inconnu',
      categorie: c?.categorie || '',
      total: v.total,
      ko: v.ko,
      tauxEchec: v.total ? Math.round((v.ko / v.total) * 100) : 0,
    };
  });
  return arr.filter(x => x.total >= 3).sort((a, b) => b.tauxEchec - a.tauxEchec).slice(0, n);
}

export function rankingAgents(controles: any[], agents: any[], months: number) {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  return agents
    .map((a: any) => {
      const cs = controles.filter(
        (c: any) => c.agentEvalueId === a.id && c.tauxConformite !== null && new Date(c.date) >= cutoff,
      );
      const moy = cs.length ? Math.round(cs.reduce((s, c) => s + c.tauxConformite, 0) / cs.length) : null;
      return { agent: a, nbControles: cs.length, tauxMoyen: moy };
    })
    .filter(x => x.nbControles > 0)
    .sort((a, b) => (b.tauxMoyen ?? -1) - (a.tauxMoyen ?? -1));
}

export function sitesEnDeclin(sites: any[], controles: any[]) {
  return sites
    .map((s: any) => {
      const byMonth = new Map<string, number[]>();
      controles
        .filter((c: any) => c.siteId === s.id && c.tauxConformite !== null)
        .forEach((c: any) => {
          const k = c.date.slice(0, 7);
          if (!byMonth.has(k)) byMonth.set(k, []);
          byMonth.get(k)!.push(c.tauxConformite);
        });
      const months = Array.from(byMonth.entries())
        .map(([k, v]) => ({ k, moy: v.reduce((a, b) => a + b, 0) / v.length }))
        .sort((a, b) => a.k.localeCompare(b.k));
      const last3 = months.slice(-3);
      if (last3.length < 3) return null;
      const isDecline = last3[0].moy > last3[1].moy && last3[1].moy > last3[2].moy;
      const delta = Math.round(last3[2].moy - last3[0].moy);
      return isDecline ? { site: s, last3, delta } : null;
    })
    .filter(Boolean) as { site: any; last3: any[]; delta: number }[];
}

export function heatmapData(sites: any[], controles: any[], nbMonths = 6) {
  const months: string[] = [];
  const now = new Date();
  for (let i = nbMonths - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  const rows = sites.map((s: any) => {
    const row: any = { site: s };
    months.forEach(m => {
      const cs = controles.filter(
        (c: any) => c.siteId === s.id && c.tauxConformite !== null && c.date.startsWith(m),
      );
      row[m] = cs.length ? Math.round(cs.reduce((sum, c) => sum + c.tauxConformite, 0) / cs.length) : null;
    });
    return row;
  });
  return { months, rows };
}
