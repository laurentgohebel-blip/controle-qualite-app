import { useState, useEffect } from 'react';

export type NotifPermission = 'default' | 'granted' | 'denied';

export function useNotifPermission(): [NotifPermission, () => Promise<NotifPermission>] {
  const [perm, setPerm] = useState<NotifPermission>(() => {
    if (typeof Notification === 'undefined') return 'denied';
    return Notification.permission;
  });

  const request = async (): Promise<NotifPermission> => {
    if (typeof Notification === 'undefined') return 'denied';
    const result = await Notification.requestPermission();
    setPerm(result);
    return result;
  };

  return [perm, request];
}

export function sendNotif(title: string, body: string, opts?: { tag?: string; url?: string }) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  try {
    const n = new Notification(title, {
      body,
      icon: '/pwa-192.svg',
      badge: '/pwa-192.svg',
      tag: opts?.tag,
    });
    if (opts?.url) {
      n.onclick = () => {
        window.focus();
        window.location.href = opts.url!;
      };
    }
  } catch {
    // silently ignore
  }
}

export function NotificationsBanner({ data }: { data: any }) {
  const [perm, request] = useNotifPermission();
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('notif-banner-dismissed') === '1');
  const [shownSummary, setShownSummary] = useState(false);

  // À l'arrivée sur le dashboard, si permission accordée, envoyer un récap
  useEffect(() => {
    if (perm !== 'granted' || shownSummary) return;
    const today = new Date().toISOString().split('T')[0];
    const planifiesAujourdhui = data.controles.filter((c: any) => c.statut === 'Planifié' && c.datePrevue === today).length;
    const actionsRetard = data.actions.filter((a: any) => new Date(a.echeance) < new Date() && a.statut !== 'Soldée').length;

    const parts: string[] = [];
    if (planifiesAujourdhui) parts.push(`${planifiesAujourdhui} contrôle${planifiesAujourdhui > 1 ? 's' : ''} prévu${planifiesAujourdhui > 1 ? 's' : ''} aujourd'hui`);
    if (actionsRetard) parts.push(`${actionsRetard} action${actionsRetard > 1 ? 's' : ''} en retard`);

    if (parts.length) {
      sendNotif('Contrôle Qualité', parts.join(' · '), { tag: 'daily-summary' });
    }
    setShownSummary(true);
  }, [perm, data, shownSummary]);

  if (typeof Notification === 'undefined') return null;
  if (perm === 'granted' || dismissed) return null;

  const dismiss = () => {
    localStorage.setItem('notif-banner-dismissed', '1');
    setDismissed(true);
  };

  return (
    <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-3">
        <div className="text-2xl">🔔</div>
        <div>
          <p className="font-medium text-blue-900">
            {perm === 'denied' ? 'Notifications bloquées' : 'Activez les notifications'}
          </p>
          <p className="text-sm text-blue-700">
            {perm === 'denied'
              ? 'Déverrouillez l\'icône cadenas à gauche de l\'URL pour réactiver.'
              : 'Recevez un récap des contrôles du jour et des actions en retard à votre arrivée sur l\'app.'}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        {perm === 'default' && (
          <button onClick={request} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
            Activer
          </button>
        )}
        <button onClick={dismiss} className="px-3 py-2 text-sm text-blue-600 hover:underline">
          Plus tard
        </button>
      </div>
    </div>
  );
}
