// Maquette statique du tableau de bord pour la landing page
export function DashboardPreview() {
  return (
    <div className="relative">
      {/* Glow décoratif */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-200 to-purple-200 blur-3xl opacity-30"></div>

      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Barre browser fake */}
        <div className="bg-gray-100 border-b border-gray-200 px-4 py-2.5 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          </div>
          <div className="flex-1 mx-4 bg-white border border-gray-300 rounded text-xs text-gray-500 px-3 py-1 text-center">
            controlequalite.app
          </div>
        </div>

        {/* Header app */}
        <div className="border-b border-gray-200 px-6 py-3 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">CQ</div>
            <span className="font-semibold text-gray-900 text-sm">Contrôle Qualité</span>
          </div>
          <nav className="hidden md:flex gap-1 text-xs text-gray-600">
            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded font-medium">Tableau de bord</span>
            <span className="px-2 py-1 rounded">Planning</span>
            <span className="px-2 py-1 rounded">Sites</span>
            <span className="px-2 py-1 rounded">Contrôles</span>
            <span className="px-2 py-1 rounded">Actions</span>
            <span className="px-2 py-1 rounded">Analytique</span>
          </nav>
          <div className="text-xs text-gray-500">demo@cqp.fr</div>
        </div>

        {/* Contenu dashboard */}
        <div className="p-6 bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-lg font-bold text-gray-900">Tableau de bord</h1>
              <p className="text-xs text-gray-500">Bienvenue Jean Dupont</p>
            </div>
            <div className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium">Nouveau contrôle</div>
          </div>

          {/* Alerte en retard */}
          <div className="bg-red-50 border-l-4 border-red-500 rounded p-3 mb-4 flex items-center gap-2">
            <span className="text-red-600">⚠️</span>
            <div>
              <p className="text-xs font-semibold text-red-900">5 actions en retard</p>
              <p className="text-[10px] text-red-700">Cliquez pour les traiter →</p>
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
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <p className="text-xs font-semibold text-gray-700 mb-2">Taux de conformité par site</p>
              <div className="flex items-end justify-around h-24 px-1">
                <Bar label="T.Nord" value={92} />
                <Bar label="T.Sud" value={87} />
                <Bar label="Albi" value={73} />
                <Bar label="Carca" value={94} />
                <Bar label="Pau" value={85} />
              </div>
              <div className="border-t border-dashed border-red-300 mt-1 relative">
                <span className="absolute -top-3 right-0 text-[9px] text-red-500">Seuil 90%</span>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <p className="text-xs font-semibold text-gray-700 mb-2">Répartition des notes</p>
              <div className="flex items-center justify-center h-24 relative">
                <svg width="80" height="80" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="20" strokeDasharray="170 251" strokeDashoffset="0" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#f59e0b" strokeWidth="20" strokeDasharray="50 251" strokeDashoffset="-170" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#ef4444" strokeWidth="20" strokeDasharray="20 251" strokeDashoffset="-220" />
                </svg>
              </div>
              <div className="flex justify-around text-[9px] mt-1">
                <Legend color="bg-green-500" label="Conforme 74%" />
                <Legend color="bg-yellow-500" label="Partiel 21%" />
                <Legend color="bg-red-500" label="NC 5%" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ icon, color, label, value }: { icon: string; color: 'blue' | 'green' | 'yellow' | 'red'; label: string; value: string }) {
  const bg = { blue: 'bg-blue-100', green: 'bg-green-100', yellow: 'bg-yellow-100', red: 'bg-red-100' }[color];
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 flex items-center gap-2">
      <div className={`w-8 h-8 ${bg} rounded flex items-center justify-center text-sm`}>{icon}</div>
      <div>
        <p className="text-[10px] text-gray-500">{label}</p>
        <p className="text-lg font-bold text-gray-900 leading-tight">{value}</p>
      </div>
    </div>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  const color = value >= 90 ? 'bg-blue-500' : value >= 80 ? 'bg-blue-400' : 'bg-red-400';
  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <div className={`w-full ${color} rounded-t`} style={{ height: `${value}%` }}></div>
      <span className="text-[9px] text-gray-500 truncate">{label}</span>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <div className={`w-2 h-2 ${color} rounded-full`}></div>
      <span className="text-gray-600">{label}</span>
    </div>
  );
}
