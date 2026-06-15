import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, CheckCircle, ClipboardList, ChevronLeft } from 'lucide-react';

const DISMISS_KEY = (uid: string) => `onboarding-dismissed-${uid}`;
const WELCOME_KEY = (uid: string) => `welcome-seen-${uid}`;

// ============== Modal de bienvenue (3 slides) ==============
export function WelcomeModal({ userId, role }: { userId: string; role: string | null }) {
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!userId || localStorage.getItem(WELCOME_KEY(userId))) return;
    setOpen(true);
  }, [userId]);

  if (!open) return null;

  const close = () => {
    localStorage.setItem(WELCOME_KEY(userId), '1');
    setOpen(false);
  };

  const slides = [
    {
      icon: <Building2 className="w-16 h-16 text-blue-600 mx-auto mb-4" />,
      title: 'Bienvenue 👋',
      body: (
        <>
          <p className="mb-3">Cette application va t'aider à <strong>contrôler la qualité de tes prestations de propreté</strong> sur le terrain et en bureau.</p>
          <p>En 5 minutes tu seras opérationnel : on te guide.</p>
        </>
      ),
    },
    {
      icon: <ClipboardList className="w-16 h-16 text-blue-600 mx-auto mb-4" />,
      title: 'Comment ça marche ?',
      body: (
        <ul className="space-y-2 text-left">
          <li><strong>1.</strong> Tu crées tes <strong>sites clients</strong> avec leurs locaux et agents</li>
          <li><strong>2.</strong> Tu importes les <strong>critères de contrôle</strong> (pack standard fourni)</li>
          <li><strong>3.</strong> Sur le terrain, tu fais des <strong>contrôles</strong> avec notes, photos, signatures</li>
          <li><strong>4.</strong> L'app calcule le <strong>taux de conformité</strong> et génère le rapport PDF pour le client</li>
        </ul>
      ),
    },
    {
      icon: <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />,
      title: 'C\'est parti !',
      body: (
        <>
          <p className="mb-3">Une <strong>checklist de démarrage</strong> t'attend sur le tableau de bord. Suis-la étape par étape.</p>
          <p className="text-sm text-gray-500">Tu peux aussi explorer l'app librement — la checklist se cochera automatiquement.</p>
        </>
      ),
    },
  ];

  const slide = slides[step];
  const isLast = step === slides.length - 1;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 text-center">
        {slide.icon}
        <h2 className="text-2xl font-bold mb-3">{slide.title}</h2>
        <div className="text-gray-700 mb-6">{slide.body}</div>

        <div className="flex justify-center gap-1 mb-4">
          {slides.map((_, i) => (
            <div key={i} className={`h-2 w-8 rounded-full ${i === step ? 'bg-blue-600' : i < step ? 'bg-blue-300' : 'bg-gray-200'}`} />
          ))}
        </div>

        <div className="flex justify-between gap-2">
          <button
            onClick={step === 0 ? close : () => setStep(step - 1)}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
          >
            {step === 0 ? 'Passer' : '← Retour'}
          </button>
          <button
            onClick={isLast ? close : () => setStep(step + 1)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {isLast ? 'Démarrer ✓' : 'Suivant →'}
          </button>
        </div>
        {role && role !== 'admin' && step === 0 && (
          <p className="text-xs text-gray-400 mt-3">Connecté en tant que <strong>{role}</strong></p>
        )}
      </div>
    </div>
  );
}

// ============== Checklist d'onboarding sur le dashboard ==============
type Task = {
  key: string;
  label: string;
  description: string;
  done: boolean;
  href: string;
};

export function OnboardingChecklist({ userId, data, isAdminOrManager }: { userId: string; data: any; isAdminOrManager: boolean }) {
  const [dismissed, setDismissed] = useState(() => userId ? !!localStorage.getItem(DISMISS_KEY(userId)) : true);
  const [collapsed, setCollapsed] = useState(false);

  if (dismissed || !isAdminOrManager) return null;

  const tasks: Task[] = [
    {
      key: 'criteres',
      label: 'Importer les critères de contrôle',
      description: 'Pack CCN Propreté en 1 clic (24 critères standards)',
      done: data.criteres.length >= 5,
      href: '/criteres',
    },
    {
      key: 'site',
      label: 'Créer votre 1er site client',
      description: 'Manuel, import Excel ou depuis un template',
      done: data.sites.length >= 1,
      href: '/sites/nouveau',
    },
    {
      key: 'locaux',
      label: 'Ajouter des locaux à vos sites',
      description: 'Bureau, Sanitaires, Circulation… au moins 1 local',
      done: data.locaux.length >= 1,
      href: data.sites[0] ? `/sites/${data.sites[0].id}` : '/sites',
    },
    {
      key: 'controle',
      label: 'Réaliser un 1er contrôle',
      description: 'Saisie en 3 étapes : informations → évaluation → récap',
      done: data.controles.filter((c: any) => c.statut !== 'Planifié').length >= 1,
      href: '/controles/nouveau',
    },
    {
      key: 'organisation',
      label: 'Inviter votre équipe',
      description: 'Contrôleurs, managers, donneurs d\'ordre clients',
      done: false, // toujours optionnel
      href: '/organisation',
    },
  ];

  const doneCount = tasks.filter(t => t.done).length;
  const requiredCount = tasks.length - 1; // organisation est optionnel
  const allDone = doneCount >= requiredCount;

  const dismiss = () => {
    if (userId) localStorage.setItem(DISMISS_KEY(userId), '1');
    setDismissed(true);
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-600 rounded-lg p-4 shadow-sm">
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1">
          <h2 className="font-semibold text-blue-900 flex items-center gap-2">
            🚀 Démarrez en {requiredCount} étapes
            <span className="text-sm font-normal text-gray-600">({doneCount}/{requiredCount} faites)</span>
          </h2>
          {allDone && (
            <p className="text-sm text-green-700 mt-1">🎉 Bravo, vous êtes opérationnel !</p>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setCollapsed(!collapsed)} className="text-sm text-gray-500 hover:underline">
            {collapsed ? '▼ Déplier' : '▲ Replier'}
          </button>
          {allDone && (
            <button onClick={dismiss} className="text-sm text-gray-500 hover:underline">Masquer</button>
          )}
        </div>
      </div>

      {!collapsed && (
        <div className="mt-4 space-y-2">
          {tasks.map(t => (
            <Link
              key={t.key}
              to={t.href}
              className={`block p-3 rounded-lg border ${t.done ? 'bg-white border-green-200 opacity-70' : 'bg-white border-gray-200 hover:border-blue-400 hover:shadow-sm'} transition`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${t.done ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {t.done ? '✓' : ''}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${t.done ? 'line-through text-gray-500' : ''}`}>{t.label}</p>
                  <p className="text-xs text-gray-500">{t.description}</p>
                </div>
                {!t.done && <ChevronLeft className="w-4 h-4 text-gray-400 rotate-180" />}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
