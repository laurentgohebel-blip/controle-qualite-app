// Maquette statique du tableau de bord pour la landing page
export function DashboardPreview() {
  return (
    <div className="relative">
      {/* Glow décoratif */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-encre/20 to-purple-200 blur-3xl opacity-30"></div>

      <div className="bg-white rounded-2xl shadow-2xl border border-filet overflow-hidden">
        {/* Barre browser fake */}
        <div className="bg-papier border-b border-filet px-4 py-2.5 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 bg-note-nc rounded-full"></div>
            <div className="w-3 h-3 bg-note-partiel rounded-full"></div>
            <div className="w-3 h-3 bg-note-conforme rounded-full"></div>
          </div>
          <div className="flex-1 mx-4 bg-white border border-filet rounded text-xs text-acier px-3 py-1 text-center">
            controlequalite.app
          </div>
        </div>

        {/* Header app */}
        <div className="border-b border-filet px-6 py-3 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-encre rounded flex items-center justify-center text-white text-xs font-bold">CQ</div>
            <span className="font-semibold text-encre text-sm">Contrôle Qualité</span>
          </div>
          <nav className="hidden md:flex gap-1 text-xs text-acier">
            <span className="px-2 py-1 bg-encre/5 text-encre-fonce rounded font-medium">Tableau de bord</span>
            <span className="px-2 py-1 rounded">Planning</span>
            <span className="px-2 py-1 rounded">Sites</span>
            <span className="px-2 py-1 rounded">Contrôles</span>
            <span className="px-2 py-1 rounded">Actions</span>
            <span className="px-2 py-1 rounded">Analytique</span>
          </nav>
          <div className="text-xs text-acier">demo@cqp.fr</div>
        </div>

        {/* Contenu dashboard */}
        <div className="p-6 bg-papier">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-lg font-bold text-encre">Tableau de bord</h1>
              <p className="text-xs text-acier">Bienvenue Jean Dupont</p>
            </div>
            <div className="px-3 py-1.5 bg-encre text-white rounded text-xs font-medium">Nouveau contrôle</div>
          </div>

          {/* Alerte en retard */}
          <div className="bg-note-nc/10 border-l-4 border-note-nc rounded p-3 mb-4 flex items-center gap-2">
            <span className="text-note-nc">⚠️</span>
            <div>
              <p className="text-xs font-semibold text-note-nc">5 actions en retard</p>
              <p className="text-[10px] text-note-nc">Cliquez pour les traiter →</p>
            </div>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            <Kpi icon="📋" color="blue" label="Contrôles totaux" value="142" />
            <Kpi icon="✓" color="green" label="Ce mois" value="18" />
            <Kpi icon="⏰" color="yellow" label="Actions ouvertes" value="23" />
            <Kpi icon="⚠️" color="red" label="En retard" value="5" />
          </div>

          {/* Graphiques */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-lg border border-filet p-3">
              <p className="text-xs font-semibold text-encre mb-2">Taux de conformité par site</p>
              <div className="flex items-end justify-around h-24 px-1">
                <Bar label="T.Nord" value={92} />
                <Bar label="T.Sud" value={87} />
                <Bar label="Albi" value={73} />
                <Bar label="Carca" value={94} />
                <Bar label="Pau" value={85} />
              </div>
              <div className="border-t border-dashed border-note-nc/30 mt-1 relative">
                <span className="absolute -top-3 right-0 text-[9px] text-note-nc">Seuil 90%</span>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-filet p-3">
              <p className="text-xs font-semibold text-encre mb-2">Répartition des notes</p>
              <div className="flex items-center justify-center h-24 relative">
                <svg width="80" height="80" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="20" strokeDasharray="170 251" strokeDashoffset="0" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#f59e0b" strokeWidth="20" strokeDasharray="50 251" strokeDashoffset="-170" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#ef4444" strokeWidth="20" strokeDasharray="20 251" strokeDashoffset="-220" />
                </svg>
              </div>
              <div className="flex justify-around text-[9px] mt-1">
                <Legend color="bg-note-conforme" label="Conforme 74%" />
                <Legend color="bg-note-partiel" label="Partiel 21%" />
                <Legend color="bg-note-nc" label="NC 5%" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ icon, color, label, value }: { icon: string; color: 'blue' | 'green' | 'yellow' | 'red'; label: string; value: string }) {
  const bg = { blue: 'bg-encre/10', green: 'bg-note-conforme/10', yellow: 'bg-note-partiel/10', red: 'bg-note-nc/10' }[color];
  return (
    <div className="bg-white rounded-lg border border-filet p-3 flex items-center gap-2">
      <div className={`w-8 h-8 ${bg} rounded flex items-center justify-center text-sm`}>{icon}</div>
      <div>
        <p className="text-[10px] text-acier">{label}</p>
        <p className="text-lg font-bold text-encre leading-tight">{value}</p>
      </div>
    </div>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  const color = value >= 90 ? 'bg-ciel' : value >= 80 ? 'bg-ciel' : 'bg-note-nc';
  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <div className={`w-full ${color} rounded-t`} style={{ height: `${value}%` }}></div>
      <span className="text-[9px] text-acier truncate">{label}</span>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <div className={`w-2 h-2 ${color} rounded-full`}></div>
      <span className="text-acier">{label}</span>
    </div>
  );
}
