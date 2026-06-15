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
    if (result === 'granted') {
      try {
        new Notification('Contrôle Qualité', { body: 'Notifications activées ✓ Vous recevrez désormais les alertes importantes.', icon: '/pwa-192.svg' });
      } catch {}
    }
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
    const today = new Date(); today.setHours(0,0,0,0);
    const in7days = new Date(); in7days.setDate(in7days.getDate() + 7);
    const upcoming = data.controles.filter((c: any) => {
      if (c.statut !== 'Planifié' || !c.datePrevue) return false;
      const d = new Date(c.datePrevue);
      return d >= today && d <= in7days;
    }).length;
    const actionsRetard = data.actions.filter((a: any) => new Date(a.echeance) < new Date() && a.statut !== 'Soldée').length;

    const parts: string[] = [];
    if (upcoming) parts.push(`${upcoming} contrôle${upcoming > 1 ? 's' : ''} à venir (7j)`);
    if (actionsRetard) parts.push(`${actionsRetard} action${actionsRetard > 1 ? 's' : ''} en retard`);

    if (parts.length) sendNotif('Récap Contrôle Qualité', parts.join(' · '), { tag: 'daily-summary' });
    setShownSummary(true);
  }, [perm, data, shownSummary]);

  const dismiss = () => {
    localStorage.setItem('notif-banner-dismissed', '1');
    setDismissed(true);
  };

  if (typeof Notification === 'undefined') return null;

  if (perm === 'granted') {
    if (dismissed) return null;
    return (
      <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-green-900">
          ✓ Notifications activées
        </div>
        <div className="flex gap-2">
          <button onClick={() => sendNotif('Test', 'Si vous voyez ce message, tout fonctionne ✓')} className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">
            Tester
          </button>
          <button onClick={dismiss} className="px-3 py-1 text-sm text-green-700 hover:underline">OK</button>
        </div>
      </div>
    );
  }

  if (dismissed) return null;

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
