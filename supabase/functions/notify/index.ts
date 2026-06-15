// Supabase Edge Function: envoie des notifications email via Resend.
//
// Déploiement :
//   supabase functions deploy notify
//   supabase secrets set RESEND_API_KEY=re_xxxxxxxx
//   supabase secrets set MAIL_FROM="Contrôle Qualité <notifications@ton-domaine.fr>"
//   supabase secrets set APP_URL=https://ton-app.vercel.app
//
// Si pas de domaine vérifié, utiliser MAIL_FROM=onboarding@resend.dev (test seulement).

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_KEY = Deno.env.get('RESEND_API_KEY')!;
const MAIL_FROM = Deno.env.get('MAIL_FROM') || 'onboarding@resend.dev';
const APP_URL = Deno.env.get('APP_URL') || 'https://example.com';

const admin = createClient(SUPABASE_URL, SERVICE_KEY);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { event, controleId, actionId } = await req.json();

    if (!RESEND_KEY) return json({ error: 'RESEND_API_KEY non configuré' }, 500);

    if (event === 'controle-soumis') {
      if (!controleId) return json({ error: 'controleId requis' }, 400);
      const result = await handleControleSoumis(controleId);
      return json(result);
    }
    if (event === 'action-creee') {
      if (!actionId) return json({ error: 'actionId requis' }, 400);
      const result = await handleActionCreee(actionId);
      return json(result);
    }
    return json({ error: `event inconnu: ${event}` }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

async function handleControleSoumis(controleId: string) {
  const { data: controle } = await admin.from('controles').select('*').eq('id', controleId).single();
  if (!controle) return { error: 'controle introuvable' };
  const { data: site } = await admin.from('sites').select('nom').eq('id', controle.site_id).single();
  // Récupère admins/managers de l'org
  const { data: members } = await admin.from('org_members').select('user_id').eq('org_id', controle.org_id).in('role', ['admin', 'manager']);
  const userIds = (members || []).map((m: any) => m.user_id);
  if (!userIds.length) return { sent: 0, message: 'Aucun manager/admin' };

  // Récupère emails via Auth Admin
  const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const emails = (users || []).filter((u: any) => userIds.includes(u.id)).map((u: any) => u.email).filter(Boolean);

  let sent = 0;
  for (const email of emails) {
    const subject = `[CQ] Contrôle à valider — ${site?.nom || controle.site_id}`;
    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:20px;color:#1f2937">
        <h2 style="color:#2563eb">Contrôle à valider</h2>
        <p>Un contrôleur vient de soumettre un contrôle pour validation.</p>
        <table style="border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:6px 12px;color:#6b7280">Site</td><td style="padding:6px 12px;font-weight:600">${site?.nom || '-'}</td></tr>
          <tr><td style="padding:6px 12px;color:#6b7280">Date</td><td style="padding:6px 12px;font-weight:600">${controle.date}</td></tr>
          <tr><td style="padding:6px 12px;color:#6b7280">Type</td><td style="padding:6px 12px;font-weight:600">${controle.type}</td></tr>
          <tr><td style="padding:6px 12px;color:#6b7280">Taux conformité</td><td style="padding:6px 12px;font-weight:600">${controle.taux_conformite ?? '-'}%</td></tr>
        </table>
        <p><a href="${APP_URL}/controles/${controleId}" style="display:inline-block;background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:500">Voir le contrôle →</a></p>
        <p style="color:#9ca3af;font-size:12px;margin-top:32px">Vous recevez cet email car vous êtes Manager ou Admin de l'organisation.</p>
      </div>`;
    if (await sendMail(email!, subject, html)) sent++;
  }
  return { sent, total: emails.length };
}

async function handleActionCreee(actionId: string) {
  const { data: action } = await admin.from('actions').select('*').eq('id', actionId).single();
  if (!action) return { error: 'action introuvable' };
  if (!action.responsable_id) return { sent: 0, message: 'pas de responsable' };
  const { data: agent } = await admin.from('agents').select('*').eq('id', action.responsable_id).single();
  if (!agent?.email) return { sent: 0, message: 'agent sans email' };
  const { data: controle } = await admin.from('controles').select('site_id').eq('id', action.controle_id).single();
  const { data: site } = controle ? await admin.from('sites').select('nom').eq('id', controle.site_id).single() : { data: null };

  const subject = `[CQ] Action corrective assignée — ${site?.nom || ''}`;
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:20px;color:#1f2937">
      <h2 style="color:#dc2626">Action corrective à traiter</h2>
      <p>Bonjour ${agent.prenom || ''},</p>
      <p>Une action corrective vient de vous être assignée.</p>
      <table style="border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:6px 12px;color:#6b7280">Site</td><td style="padding:6px 12px;font-weight:600">${site?.nom || '-'}</td></tr>
        <tr><td style="padding:6px 12px;color:#6b7280">Description</td><td style="padding:6px 12px">${action.description_nc}</td></tr>
        <tr><td style="padding:6px 12px;color:#6b7280">Action à mener</td><td style="padding:6px 12px">${action.action}</td></tr>
        <tr><td style="padding:6px 12px;color:#6b7280">Échéance</td><td style="padding:6px 12px;font-weight:600">${action.echeance}</td></tr>
      </table>
      <p><a href="${APP_URL}/actions" style="display:inline-block;background:#dc2626;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:500">Voir mes actions →</a></p>
    </div>`;
  const ok = await sendMail(agent.email, subject, html);
  return { sent: ok ? 1 : 0 };
}

async function sendMail(to: string, subject: string, html: string): Promise<boolean> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: MAIL_FROM, to: [to], subject, html }),
  });
  if (!res.ok) {
    console.error('Resend error:', await res.text());
    return false;
  }
  return true;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
}
