import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, ClipboardList, ChevronLeft, BarChart3, FileCheck, Camera } from 'lucide-react';

const DISMISS_KEY = (uid: string) => `onboarding-dismissed-${uid}`;
const WELCOME_KEY = (uid: string) => `welcome-seen-${uid}`;

// ============== Modal de bienvenue (5 slides) ==============
export function WelcomeModal({ userId, role: _role }: { userId: string; role: string | null }) {
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId || localStorage.getItem(WELCOME_KEY(userId))) return;
    setOpen(true);
  }, [userId]);

  if (!open) return null;

  const close = () => {
    localStorage.setItem(WELCOME_KEY(userId), '1');
    setOpen(false);
  };

  const goTo = (path: string) => {
    close();
    navigate(path);
  };

  const slides = [
    {
      icon: '👋',
      title: 'Bienvenue dans la démo',
      body: (
        <>
          <p className="mb-3 text-gray-700">Vous explorez une version d'essai avec des <strong>données fictives</strong> (3 sites, 12 contrôles, agents, actions correctives).</p>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-900">
            ✨ <strong>Aucune inscription requise.</strong> Vos modifications ne sont pas enregistrées et seront réinitialisées au prochain accès.
          </div>
        </>
      ),
    },
    {
      icon: <ClipboardList className="w-16 h-16 text-blue-600 mx-auto" />,
      title: 'Faites un contrôle en 3 étapes',
      body: (
        <>
          <p className="mb-3 text-gray-700">Le cœur de l'app : une saisie pensée pour le terrain.</p>
          <ul className="space-y-1.5 text-left text-sm">
            <li>📋 Sélection des locaux à contrôler</li>
            <li>✅ Notation par critères pondérés (Conforme / Partiel / Non conforme)</li>
            <li>📷 Photos terrain + 🎤 dictée vocale du commentaire</li>
            <li>✍️ Signatures électroniques contrôleur + agent</li>
            <li>📊 Calcul automatique du taux de conformité</li>
          </ul>
          <button onClick={() => goTo('/controles/nouveau')} className="mt-4 text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            🚀 Essayer maintenant →
          </button>
        </>
      ),
    },
    {
      icon: <BarChart3 className="w-16 h-16 text-blue-600 mx-auto" />,
      title: 'Pilotez votre activité',
      body: (
        <>
          <p className="mb-3 text-gray-700">Des indicateurs au service de votre management.</p>
          <ul className="space-y-1.5 text-left text-sm">
            <li>🗺️ Heatmap tous sites × mois</li>
            <li>🎯 Top critères en échec pour décider des formations</li>
            <li>🏅 Ranking des agents sur 3, 6 ou 12 mois</li>
            <li>⚠️ Détection automatique des sites en déclin</li>
            <li>📅 Planning récurrent (« tous les lundis pendant 3 mois »)</li>
          </ul>
          <button onClick={() => goTo('/analytique')} className="mt-4 text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            📊 Voir l'analytique →
          </button>
        </>
      ),
    },
    {
      icon: <FileCheck className="w-16 h-16 text-blue-600 mx-auto" />,
      title: 'Transmettez à vos clients',
      body: (
        <>
          <p className="mb-3 text-gray-700">Plusieurs façons de partager le résultat avec votre donneur d'ordre.</p>
          <ul className="space-y-1.5 text-left text-sm">
            <li>📄 PDF professionnel avec KPI + photos + signatures</li>
            <li>🔗 Lien web sécurisé (valable 90 jours, sans inscription)</li>
            <li>👤 Compte permanent en lecture seule sur ses sites</li>
            <li>📧 Email automatique pré-rempli au validateur</li>
          </ul>
          <button onClick={() => goTo('/controles')} className="mt-4 text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            📂 Voir les contrôles →
          </button>
        </>
      ),
    },
    {
      icon: <Camera className="w-16 h-16 text-purple-600 mx-auto" />,
      title: 'Et bien plus encore',
      body: (
        <>
          <p className="mb-3 text-gray-700">Quelques fonctionnalités qui font la différence :</p>
          <ul className="space-y-1.5 text-left text-sm">
            <li>🏢 Multi-utilisateurs avec rôles (admin / manager / contrôleur)</li>
            <li>✅ Workflow d'approbation manager</li>
            <li>📥 Import Excel des sites en masse</li>
            <li>🚀 Templates de sites pré-configurés</li>
            <li>📱 PWA installable sur téléphone, mode hors-ligne</li>
            <li>🔄 Planification récurrente automatique</li>
            <li>📚 Pack de critères CCN Propreté inclus</li>
          </ul>
        </>
      ),
    },
    {
      icon: <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />,
      title: 'Convaincu ? Créez votre compte',
      body: (
        <>
          <p className="mb-3 text-gray-700">L'essai et la version Découverte sont <strong>gratuits à vie</strong>. Aucune carte bancaire requise.</p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-900 mb-4">
            ✓ Vos propres sites & contrôleurs<br />
            ✓ Vos propres clients en accès lecture<br />
            ✓ Vos données persistées en sécurité
          </div>
          <button onClick={() => { close(); localStorage.removeItem('demo-mode'); window.location.href = '/login'; }} className="text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-2.5 rounded-lg hover:opacity-90 font-medium">
            Créer mon compte gratuit →
          </button>
          <p className="text-xs text-gray-500 mt-3">Vous pouvez aussi continuer à explorer la démo librement.</p>
        </>
      ),
    },
  ];

  const slide = slides[step];
  const isLast = step === slides.length - 1;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-8 text-center max-h-[90vh] overflow-y-auto">
        {typeof slide.icon === 'string' ? <div className="text-6xl mb-3">{slide.icon}</div> : <div className="mb-3">{slide.icon}</div>}
        <h2 className="text-2xl font-bold mb-3">{slide.title}</h2>
        <div className="text-gray-700 mb-6">{slide.body}</div>

        <div className="flex justify-center gap-1 mb-4">
          {slides.map((_, i) => (
            <div key={i} className={`h-2 rounded-full transition-all ${i === step ? 'w-8 bg-blue-600' : i < step ? 'w-2 bg-blue-300' : 'w-2 bg-gray-200'}`} />
          ))}
        </div>

        <div className="flex justify-between gap-2">
          <button
            onClick={step === 0 ? close : () => setStep(step - 1)}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
          >
            {step === 0 ? 'Fermer' : '← Retour'}
          </button>
          <div className="text-xs text-gray-400 self-center">{step + 1} / {slides.length}</div>
          <button
            onClick={isLast ? close : () => setStep(step + 1)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {isLast ? 'Continuer la démo' : 'Suivant →'}
          </button>
        </div>
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
