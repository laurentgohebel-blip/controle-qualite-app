import { useState, useEffect } from 'react';

// Durée de chaque scène en ms
const SCENES = [
  { duration: 3000, name: 'intro' },
  { duration: 4500, name: 'saisie' },
  { duration: 3500, name: 'photo' },
  { duration: 3500, name: 'signature' },
  { duration: 3500, name: 'pdf' },
  { duration: 4000, name: 'analytique' },
  { duration: 3500, name: 'cta' },
];

export function Explainer() {
  const [scene, setScene] = useState(0);

  useEffect(() => {
    const id = setTimeout(() => setScene((scene + 1) % SCENES.length), SCENES[scene].duration);
    return () => clearTimeout(id);
  }, [scene]);

  return (
    <div className="relative aspect-video w-full bg-gradient-to-br from-papier via-white to-purple-50 rounded-2xl overflow-hidden border border-filet shadow-xl">
      {/* Barre de progression entre scènes */}
      <div className="absolute top-0 left-0 right-0 flex gap-1 p-2 z-30">
        {SCENES.map((_, i) => (
          <div key={i} className="h-1 flex-1 bg-white/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-encre transition-all"
              style={{ width: i < scene ? '100%' : i === scene ? '100%' : '0%', transitionDuration: i === scene ? `${SCENES[i].duration}ms` : '0ms' }}
            />
          </div>
        ))}
      </div>

      {/* Logo coin haut */}
      <div className="absolute top-5 right-5 z-20 flex items-center gap-2 bg-white/80 backdrop-blur px-3 py-1.5 rounded-full text-xs font-semibold text-encre-fonce">
        <span className="w-2 h-2 bg-encre rounded-full"></span>
        Contrôle Qualité
      </div>

      {/* SCÈNES */}
      <Scene active={scene === 0}>
        <IntroScene />
      </Scene>
      <Scene active={scene === 1}>
        <SaisieScene />
      </Scene>
      <Scene active={scene === 2}>
        <PhotoScene />
      </Scene>
      <Scene active={scene === 3}>
        <SignatureScene />
      </Scene>
      <Scene active={scene === 4}>
        <PdfScene />
      </Scene>
      <Scene active={scene === 5}>
        <AnalytiqueScene />
      </Scene>
      <Scene active={scene === 6}>
        <CtaScene />
      </Scene>
    </div>
  );
}

function Scene({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <div className={`absolute inset-0 flex flex-col items-center justify-center px-8 transition-opacity duration-700 ${active ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      {children}
    </div>
  );
}

// ============== SCÈNE 1 : INTRO ==============
function IntroScene() {
  return (
    <div className="text-center">
      <div className="text-7xl mb-6 animate-bounce">📋</div>
      <h2 className="text-3xl md:text-4xl font-bold text-encre mb-3">
        Le contrôle qualité,<br />
        <span className="bg-gradient-to-r from-encre to-purple-600 bg-clip-text text-transparent">repensé pour le terrain</span>
      </h2>
      <p className="text-acier mt-4">Pour les sociétés de propreté qui n'ont plus le temps pour Excel</p>
    </div>
  );
}

// ============== SCÈNE 2 : SAISIE 3 ÉTAPES ==============
function SaisieScene() {
  return (
    <div className="flex flex-col md:flex-row items-center gap-8 max-w-4xl">
      <div className="md:w-1/2 text-center md:text-left">
        <p className="text-sm font-semibold text-encre mb-2">SAISIE TERRAIN</p>
        <h3 className="text-2xl md:text-3xl font-bold text-encre mb-3">3 étapes,<br />3 minutes</h3>
        <p className="text-acier">Sélectionnez les locaux, notez les critères, signez. Le taux de conformité se calcule tout seul.</p>
      </div>
      <div className="md:w-1/2 flex justify-center">
        <PhoneMockup>
          <div className="space-y-2 p-3">
            <div className="text-xs text-acier font-semibold">Bureau Direction · 1er étage</div>
            <CriterionRow label="Aspiration sol" note="Conforme" delay={0} />
            <CriterionRow label="Dessus de bureau" note="Conforme" delay={400} />
            <CriterionRow label="Vidage corbeille" note="Partiel" delay={800} />
            <CriterionRow label="Interrupteurs" note="Conforme" delay={1200} />
            <CriterionRow label="Vitres" note="Non" delay={1600} />
            <div className="pt-2 mt-2 border-t flex justify-between items-center">
              <span className="text-xs font-semibold text-encre">Taux</span>
              <span className="text-lg font-bold text-note-conforme animate-pulse">87%</span>
            </div>
          </div>
        </PhoneMockup>
      </div>
    </div>
  );
}

function CriterionRow({ label, note, delay }: { label: string; note: 'Conforme' | 'Partiel' | 'Non'; delay: number }) {
  const colors = { Conforme: 'bg-note-conforme', Partiel: 'bg-note-partiel', Non: 'bg-note-nc' };
  return (
    <div className="flex items-center justify-between text-xs animate-fade-in-up" style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}>
      <span className="text-encre">{label}</span>
      <span className={`px-2 py-0.5 rounded-full text-white text-[10px] font-medium ${colors[note]}`}>{note}</span>
    </div>
  );
}

// ============== SCÈNE 3 : PHOTO ==============
function PhotoScene() {
  return (
    <div className="flex flex-col md:flex-row items-center gap-8 max-w-4xl">
      <div className="md:w-1/2 text-center md:text-left">
        <p className="text-sm font-semibold text-encre mb-2">PREUVES TERRAIN</p>
        <h3 className="text-2xl md:text-3xl font-bold text-encre mb-3">Photo + dictée vocale</h3>
        <p className="text-acier">Capturez le défaut depuis le téléphone. Commentez à voix haute, le texte se tape tout seul.</p>
      </div>
      <div className="md:w-1/2 flex justify-center">
        <PhoneMockup>
          <div className="p-3 space-y-3">
            <div className="aspect-square bg-gradient-to-br from-filet to-acier-clair rounded-lg relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center text-5xl animate-zoom-in">📷</div>
              <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 text-white text-[10px] rounded">Hall RDC</div>
            </div>
            <div className="bg-note-nc/10 border border-note-nc/20 rounded p-2">
              <p className="text-[10px] text-note-nc typewriter">Trace de pas humide à l'entrée nord</p>
            </div>
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-note-nc/10 border border-note-nc/30 rounded-full text-xs text-note-nc animate-pulse">
                <span className="w-2 h-2 bg-note-nc rounded-full animate-ping"></span>
                Dictée en cours
              </div>
            </div>
          </div>
        </PhoneMockup>
      </div>
    </div>
  );
}

// ============== SCÈNE 4 : SIGNATURE ==============
function SignatureScene() {
  return (
    <div className="flex flex-col md:flex-row items-center gap-8 max-w-4xl">
      <div className="md:w-1/2 text-center md:text-left">
        <p className="text-sm font-semibold text-encre mb-2">VALIDATION ÉLECTRONIQUE</p>
        <h3 className="text-2xl md:text-3xl font-bold text-encre mb-3">Signatures en direct</h3>
        <p className="text-acier">Contrôleur et agent évalué signent au doigt sur l'écran. Le contrôle devient une preuve incontestable.</p>
      </div>
      <div className="md:w-1/2 flex justify-center">
        <PhoneMockup>
          <div className="p-3 space-y-3">
            <p className="text-[10px] font-semibold text-acier">SIGNATURES</p>
            <div>
              <p className="text-[10px] text-acier mb-1">Contrôleur</p>
              <div className="h-12 bg-white border rounded relative overflow-hidden">
                <svg viewBox="0 0 200 50" className="w-full h-full">
                  <path d="M 20 35 Q 40 10, 60 25 T 100 30 T 140 20 T 180 28" stroke="#1f2937" strokeWidth="2" fill="none" className="signature-draw" />
                </svg>
              </div>
            </div>
            <div>
              <p className="text-[10px] text-acier mb-1">Agent évalué</p>
              <div className="h-12 bg-white border rounded relative overflow-hidden">
                <svg viewBox="0 0 200 50" className="w-full h-full">
                  <path d="M 20 30 Q 35 15, 55 28 Q 75 35, 95 22 T 135 30 T 175 25" stroke="#1f2937" strokeWidth="2" fill="none" className="signature-draw-2" />
                </svg>
              </div>
            </div>
            <div className="bg-note-conforme/10 border border-note-conforme/20 rounded p-2 text-center text-xs text-note-conforme font-medium">✓ Contrôle validé</div>
          </div>
        </PhoneMockup>
      </div>
    </div>
  );
}

// ============== SCÈNE 5 : PDF ==============
function PdfScene() {
  return (
    <div className="flex flex-col md:flex-row items-center gap-8 max-w-4xl">
      <div className="md:w-1/2 text-center md:text-left">
        <p className="text-sm font-semibold text-encre mb-2">LIVRABLE CLIENT</p>
        <h3 className="text-2xl md:text-3xl font-bold text-encre mb-3">Rapport PDF instantané</h3>
        <p className="text-acier">Photos, signatures, KPI, actions correctives. Envoyé par mail ou via un lien sécurisé en 1 clic.</p>
      </div>
      <div className="md:w-1/2 flex justify-center">
        <div className="relative w-64 h-80 bg-white shadow-2xl rounded animate-slide-up">
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-encre rounded flex items-center justify-center text-white text-sm font-bold">CQ</div>
              <div className="text-sm font-bold text-encre">Rapport de contrôle</div>
            </div>
            <div className="text-xs text-acier">Toulouse Nord · 14 juin 2026</div>
            <div className="border-t pt-3">
              <div className="text-xs text-acier mb-1">Taux de conformité</div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-note-conforme">87</span>
                <span className="text-sm text-acier">%</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="h-1.5 bg-note-conforme w-full rounded"></div>
              <div className="h-1.5 bg-note-conforme w-5/6 rounded"></div>
              <div className="h-1.5 bg-note-partiel w-2/3 rounded"></div>
              <div className="h-1.5 bg-note-nc w-1/3 rounded"></div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="aspect-square bg-filet-clair rounded"></div>
              <div className="aspect-square bg-filet rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============== SCÈNE 6 : ANALYTIQUE ==============
function AnalytiqueScene() {
  const sites = ['Toulouse N.', 'Toulouse S.', 'Albi', 'Carcassonne'];
  const months = ['Mar', 'Avr', 'Mai', 'Jun'];
  const data = [
    [92, 88, 91, 87],
    [85, 89, 90, 91],
    [78, 75, 71, 68], // déclin
    [94, 96, 95, 93],
  ];
  const color = (v: number) => v >= 90 ? 'bg-note-conforme' : v >= 75 ? 'bg-note-partiel' : 'bg-note-nc';

  return (
    <div className="flex flex-col md:flex-row items-center gap-8 max-w-4xl w-full">
      <div className="md:w-1/2 text-center md:text-left">
        <p className="text-sm font-semibold text-encre mb-2">PILOTAGE</p>
        <h3 className="text-2xl md:text-3xl font-bold text-encre mb-3">Voyez tout, en un coup d'œil</h3>
        <p className="text-acier">Heatmap mensuelle, ranking agents, détection des sites en déclin avant que le client ne s'en rende compte.</p>
      </div>
      <div className="md:w-1/2 w-full">
        <div className="bg-white rounded-xl shadow-xl p-4 border border-filet">
          <p className="text-xs text-acier font-semibold mb-3">CONFORMITÉ — 4 derniers mois</p>
          <div className="grid grid-cols-5 gap-1 text-[10px]">
            <div></div>
            {months.map(m => <div key={m} className="text-center text-acier font-medium">{m}</div>)}
            {sites.map((site, si) => (
              <>
                <div key={`s-${si}`} className="text-encre truncate font-medium flex items-center">{site}</div>
                {months.map((_m, mi) => (
                  <div key={`${si}-${mi}`} className={`aspect-square rounded text-white text-center text-[9px] font-bold flex items-center justify-center ${color(data[si][mi])} animate-fade-in`} style={{ animationDelay: `${(si * 4 + mi) * 100}ms`, animationFillMode: 'both' }}>
                    {data[si][mi]}
                  </div>
                ))}
              </>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t bg-note-alerte/10 -mx-4 -mb-4 px-4 py-2 rounded-b-xl">
            <p className="text-xs text-note-alerte"><strong>⚠️ Albi en déclin</strong> · −10 points sur 3 mois</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============== SCÈNE 7 : CTA ==============
function CtaScene() {
  return (
    <div className="text-center">
      <div className="text-5xl mb-4">🚀</div>
      <h3 className="text-3xl md:text-4xl font-bold text-encre mb-3">Essayez maintenant</h3>
      <p className="text-acier mb-6 max-w-md mx-auto">Démo en ligne avec données fictives. Aucune inscription requise.</p>
      <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-encre to-purple-600 text-white rounded-lg font-medium shadow-lg animate-pulse-soft">
        Voir la démo →
      </div>
    </div>
  );
}

// ============== UTILS ==============
function PhoneMockup({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-56 h-[400px] bg-encre rounded-[2rem] p-2 shadow-2xl">
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-encre rounded-b-2xl z-10"></div>
      <div className="w-full h-full bg-white rounded-[1.5rem] overflow-hidden pt-6">
        {children}
      </div>
    </div>
  );
}
