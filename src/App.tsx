import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { supabase, fetchAll, upsertRow, upsertMany, deleteRow, uploadPhoto } from './lib/supabase';
import type { ImportPreview } from './lib/excel';
// Wrappers lazy : ne charge jspdf/xlsx que lors d'un export, pas au démarrage de l'app
const exportControlePdf = async (opts: any) => (await import('./lib/pdf')).exportControlePdf(opts);
const exportRapportMensuelPdf = async (opts: any) => (await import('./lib/pdf')).exportRapportMensuelPdf(opts);
const exportControlesExcel = async (opts: any) => (await import('./lib/excel')).exportControlesExcel(opts);
const downloadTemplateSites = async () => (await import('./lib/excel')).downloadTemplateSites();
const parseImportFile = async (file: File, existing: any[]) => (await import('./lib/excel')).parseImportFile(file, existing);
import { topCriteresEnEchec, rankingAgents, sitesEnDeclin, heatmapData, tauxMoyenPeriode } from './lib/analytics';
import { SignaturePad } from './components/SignaturePad';
import { WelcomeModal, OnboardingChecklist } from './components/Onboarding';
import { LandingPage } from './components/LandingPage';
import { VoiceButton } from './components/VoiceInput';
import { NotificationsBanner, sendNotif } from './components/Notifications';
import { ErrorBoundary, GlobalErrorBoundary } from './components/ErrorBoundary';
import { PACKS } from './lib/criteresPacks';
import {
  Home, Building2, ClipboardList, Camera, CheckCircle,
  AlertCircle, ChevronLeft, LogOut, Clock
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';

// ========== TYPES ==========
type NoteType = 'Conforme' | 'Partiellement conforme' | 'Non conforme' | 'Non applicable';
type TypeControle = 'Programmé' | 'Inopiné' | 'Contradictoire client';
type StatutControle = 'Planifié' | 'Brouillon' | 'Terminé' | 'Validé';
type StatutAction = 'Ouverte' | 'En cours' | 'Soldée';
type TypeLocal = 'Bureau' | 'Sanitaire' | 'Circulation' | 'Vestiaire' | 'Cuisine/Office' | 'Vitrerie' | 'Extérieur';
type Categorie = 'Sols' | 'Sanitaires' | 'Surfaces' | 'Poussières' | 'Déchets' | 'Vitrerie' | 'Approvisionnement consommables';
type Frequence = 'Hebdomadaire' | 'Mensuelle';
type IconType = React.ElementType;

// ========== INTERFACES ==========
interface Site {
  id: string;
  nom: string;
  adresse: string;
  ville: string;
  client: string;
  responsableSecteur: string;
  frequenceControle: Frequence;
  seuilCible: number;
  emailClient?: string;
}

interface Local {
  id: string;
  nom: string;
  type: TypeLocal;
  surface: number;
  etage: string;
  siteId: string;
}

interface Critere {
  id: string;
  libelle: string;
  categorie: Categorie;
  coefficient: number;
  typeLocal: TypeLocal[];
}

interface Agent {
  id: string;
  nom: string;
  prenom: string;
  siteId: string;
  email?: string;
}

interface Controle {
  id: string;
  siteId: string;
  date: string;
  type: TypeControle;
  statut: StatutControle;
  controleurId: string;
  agentEvalueId: string;
  tauxConformite: number | null;
  commentaireGeneral: string;
  createdAt: string;
  signatureControleur?: string | null;
  signatureAgent?: string | null;
  datePrevue?: string | null;
}

interface Resultat {
  id: string;
  controleId: string;
  critereId: string;
  localId: string;
  note: NoteType;
  photo: string | null;
  commentaire: string;
}

interface ActionCorrective {
  id: string;
  controleId: string;
  descriptionNc: string;
  action: string;
  responsableId: string;
  echeance: string;
  statut: StatutAction;
  createdAt: string;
}

// ========== DONNÉES MOCK ==========
const MOCK_SITES: Site[] = [
  { id: 's1', nom: 'Toulouse Nord', adresse: '123 Rue de la Propreté', ville: 'Toulouse', client: 'CCN Propreté', responsableSecteur: 'Jean Dupont', frequenceControle: 'Hebdomadaire', seuilCible: 90 },
  { id: 's2', nom: 'Toulouse Sud', adresse: '456 Avenue des Services', ville: 'Toulouse', client: 'CCN Propreté', responsableSecteur: 'Marie Martin', frequenceControle: 'Mensuelle', seuilCible: 90 },
  { id: 's3', nom: 'Albi', adresse: '789 Boulevard Central', ville: 'Albi', client: 'Mairie d\'Albi', responsableSecteur: 'Pierre Bernard', frequenceControle: 'Hebdomadaire', seuilCible: 95 },
];

const MOCK_LOCAUX: Local[] = [
  { id: 'l1', nom: 'Hall d\'accueil', type: 'Circulation', surface: 50, etage: 'RDC', siteId: 's1' },
  { id: 'l2', nom: 'Bureau Direction', type: 'Bureau', surface: 30, etage: '1er', siteId: 's1' },
  { id: 'l3', nom: 'Sanitaires Hommes', type: 'Sanitaire', surface: 15, etage: 'RDC', siteId: 's1' },
  { id: 'l4', nom: 'Sanitaires Femmes', type: 'Sanitaire', surface: 15, etage: 'RDC', siteId: 's1' },
  { id: 'l5', nom: 'Cuisine', type: 'Cuisine/Office', surface: 25, etage: 'RDC', siteId: 's1' },
];

const MOCK_CRITERES: Critere[] = [
  { id: 'c1', libelle: 'Aspiration/balayage humide', categorie: 'Sols', coefficient: 3, typeLocal: ['Bureau', 'Circulation', 'Vestiaire', 'Cuisine/Office'] },
  { id: 'c2', libelle: 'Absence de traces', categorie: 'Sols', coefficient: 3, typeLocal: ['Bureau', 'Circulation', 'Sanitaire', 'Cuisine/Office'] },
  { id: 'c3', libelle: 'Plinthes nettoyées', categorie: 'Sols', coefficient: 3, typeLocal: ['Sanitaire', 'Cuisine/Office'] },
  { id: 'c5', libelle: 'Cuvettes/urinoirs propres', categorie: 'Sanitaires', coefficient: 3, typeLocal: ['Sanitaire'] },
  { id: 'c6', libelle: 'Lavabos et miroirs', categorie: 'Sanitaires', coefficient: 3, typeLocal: ['Sanitaire'] },
  { id: 'c7', libelle: 'Sol des sanitaires', categorie: 'Sanitaires', coefficient: 3, typeLocal: ['Sanitaire'] },
  { id: 'c8', libelle: 'Désinfection visible', categorie: 'Sanitaires', coefficient: 3, typeLocal: ['Sanitaire'] },
  { id: 'c9', libelle: 'Absence d\'odeurs', categorie: 'Sanitaires', coefficient: 3, typeLocal: ['Sanitaire'] },
  { id: 'c10', libelle: 'Dépoussiérage bureaux', categorie: 'Surfaces', coefficient: 2, typeLocal: ['Bureau', 'Cuisine/Office'] },
  { id: 'c11', libelle: 'Dessus de meubles', categorie: 'Surfaces', coefficient: 2, typeLocal: ['Bureau', 'Cuisine/Office', 'Vestiaire'] },
  { id: 'c12', libelle: 'Interrupteurs et poignées', categorie: 'Surfaces', coefficient: 2, typeLocal: ['Bureau', 'Circulation', 'Sanitaire'] },
  { id: 'c13', libelle: 'Hautes surfaces', categorie: 'Poussières', coefficient: 1, typeLocal: ['Bureau', 'Circulation'] },
  { id: 'c14', libelle: 'Grilles d\'aération', categorie: 'Poussières', coefficient: 1, typeLocal: ['Bureau', 'Sanitaire', 'Cuisine/Office'] },
  { id: 'c16', libelle: 'Vidage corbeilles', categorie: 'Déchets', coefficient: 2, typeLocal: ['Bureau', 'Circulation', 'Sanitaire', 'Cuisine/Office'] },
  { id: 'c17', libelle: 'Changement de sacs', categorie: 'Déchets', coefficient: 2, typeLocal: ['Bureau', 'Circulation', 'Sanitaire', 'Cuisine/Office'] },
  { id: 'c19', libelle: 'Vitres intérieures', categorie: 'Vitrerie', coefficient: 2, typeLocal: ['Bureau', 'Circulation'] },
  { id: 'c20', libelle: 'Portes vitrées', categorie: 'Vitrerie', coefficient: 2, typeLocal: ['Bureau', 'Circulation'] },
  { id: 'c22', libelle: 'Papier WC réapprovisionné', categorie: 'Approvisionnement consommables', coefficient: 1, typeLocal: ['Sanitaire'] },
  { id: 'c23', libelle: 'Essuie-mains disponibles', categorie: 'Approvisionnement consommables', coefficient: 1, typeLocal: ['Sanitaire', 'Cuisine/Office'] },
];

const MOCK_AGENTS: Agent[] = [
  { id: 'a1', nom: 'Dupont', prenom: 'Jean', siteId: 's1' },
  { id: 'a2', nom: 'Martin', prenom: 'Marie', siteId: 's1' },
  { id: 'a3', nom: 'Bernard', prenom: 'Pierre', siteId: 's2' },
];

const NOTE_SCORES: Record<NoteType, number> = {
  'Conforme': 1,
  'Partiellement conforme': 0.5,
  'Non conforme': 0,
  'Non applicable': 0
};

const NOTE_COLORS: Record<NoteType, string> = {
  'Conforme': 'bg-green-500',
  'Partiellement conforme': 'bg-yellow-500',
  'Non conforme': 'bg-red-500',
  'Non applicable': 'bg-gray-400'
};

// ========== CONTEXTE & STORAGE ==========
interface Template {
  id: string;
  nom: string;
  description?: string;
  locaux: { nom: string; type: string; surface: number; etage: string }[];
  agents?: { prenom: string; nom: string; email?: string }[];
  frequenceControle?: string;
  seuilCible?: number;
}

interface CommentaireType {
  id: string;
  libelle: string;
  note?: string | null;
  categorie?: string | null;
}

interface AppData {
  sites: Site[];
  locaux: Local[];
  criteres: Critere[];
  agents: Agent[];
  controles: Controle[];
  resultats: Resultat[];
  actions: ActionCorrective[];
  templates: Template[];
  commentairesTypes: CommentaireType[];
}

const EMPTY_DATA: AppData = { sites: [], locaux: [], criteres: [], agents: [], controles: [], resultats: [], actions: [], templates: [], commentairesTypes: [] };

const isDemoMode = () => localStorage.getItem('demo-mode') === '1';

function generateDemoData(): AppData {
  const sites = MOCK_SITES.map(s => ({ ...s, emailClient: 'client@exemple.fr' }));
  const locaux = MOCK_LOCAUX;
  const criteres = MOCK_CRITERES;
  const agents = MOCK_AGENTS.map(a => ({ ...a, email: `${a.prenom.toLowerCase()}.${a.nom.toLowerCase()}@exemple.fr` }));

  const controles: any[] = [];
  const resultats: any[] = [];
  const actions: any[] = [];

  for (let i = 0; i < 12; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i * 12);
    const site = sites[i % sites.length];
    const cId = 'demo-c-' + i;
    const baseTaux = 75 + ((i * 17) % 25);
    controles.push({
      id: cId, siteId: site.id, date: d.toISOString().split('T')[0],
      type: ['Programmé', 'Programmé', 'Inopiné', 'Contradictoire client'][i % 4],
      statut: i === 0 ? 'Brouillon' : i === 1 ? 'Terminé' : 'Validé',
      controleurId: '', agentEvalueId: agents[i % agents.length].id,
      tauxConformite: baseTaux, commentaireGeneral: '', createdAt: d.toISOString(),
    } as any);
    const siteLocaux = locaux.filter(l => l.siteId === site.id);
    for (const local of siteLocaux.slice(0, 3)) {
      const applicables = criteres.filter(c => c.typeLocal.includes(local.type)).slice(0, 4);
      for (const cr of applicables) {
        const r = (i * 13 + cr.id.length + local.id.length) % 10;
        const note = r < 6 ? 'Conforme' : r < 8 ? 'Partiellement conforme' : r < 9 ? 'Non conforme' : 'Non applicable';
        resultats.push({
          id: 'demo-r-' + resultats.length, controleId: cId, critereId: cr.id, localId: local.id,
          note, photo: null, commentaire: '',
        } as any);
        if (note === 'Non conforme') {
          actions.push({
            id: 'demo-a-' + actions.length, controleId: cId,
            descriptionNc: 'Non-conformité: ' + cr.libelle,
            action: 'Repasser et nettoyer',
            responsableId: agents[0].id,
            echeance: new Date(d.getTime() + 7 * 86400000).toISOString().split('T')[0],
            statut: (i + r) % 3 === 0 ? 'Soldée' : (i + r) % 3 === 1 ? 'En cours' : 'Ouverte',
            createdAt: d.toISOString(),
          } as any);
        }
      }
    }
  }

  // Quelques contrôles planifiés futurs
  for (let i = 1; i <= 4; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i * 7);
    const site = sites[i % sites.length];
    controles.push({
      id: 'demo-p-' + i, siteId: site.id, date: d.toISOString().split('T')[0],
      datePrevue: d.toISOString().split('T')[0],
      type: 'Programmé', statut: 'Planifié',
      controleurId: '', agentEvalueId: '', tauxConformite: null, commentaireGeneral: '', createdAt: new Date().toISOString(),
    } as any);
  }

  const commentairesTypes = [
    { id: 'demo-ct-1', libelle: 'Trace de pas humide visible', note: 'Non conforme', categorie: 'Sols' },
    { id: 'demo-ct-2', libelle: 'Poubelle non vidée', note: 'Non conforme', categorie: 'Déchets' },
    { id: 'demo-ct-3', libelle: 'Désinfection effectuée correctement', note: 'Conforme', categorie: 'Sanitaires' },
    { id: 'demo-ct-4', libelle: 'Quelques traces de doigts sur la porte vitrée', note: 'Partiellement conforme', categorie: 'Vitrerie' },
    { id: 'demo-ct-5', libelle: 'Hautes surfaces légèrement empoussiérées', note: 'Partiellement conforme', categorie: 'Poussières' },
    { id: 'demo-ct-6', libelle: 'Absence d\'odeurs', note: 'Conforme' },
    { id: 'demo-ct-7', libelle: 'Critère non observable lors du contrôle', note: 'Non applicable' },
  ] as any[];

  return { sites, locaux, criteres, agents, controles, resultats, actions, templates: [], commentairesTypes };
}

const AppContext = React.createContext<{
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  session: any;
  loading: boolean;
  isClientMode: boolean;
  ownsSite: (siteId: string) => boolean;
  role: string | null;
  isAdminOrManager: boolean;
  orgId: string | null;
  currentUser: Agent | null;
  setCurrentUser: (user: Agent | null) => void;
  addControle: (c: any, resultats: any[], actions: any[]) => Promise<void>;
  saveRow: (table: any, row: any) => Promise<void>;
  removeRow: (table: any, id: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
} | null>(null);

async function seedMocksForUser() {
  await upsertMany('sites', MOCK_SITES);
  await upsertMany('locaux', MOCK_LOCAUX);
  await upsertMany('criteres', MOCK_CRITERES);
  await upsertMany('agents', MOCK_AGENTS);
}

function AppProvider({ children }: { children: React.ReactNode }) {
  const demo = isDemoMode();
  const [data, setData] = useState<AppData>(() => demo ? generateDemoData() : EMPTY_DATA);
  const [session, setSession] = useState<any>(demo ? { user: { id: 'demo', email: 'demo@local' } } : null);
  const [loading, setLoading] = useState(!demo);
  const [role, setRole] = useState<string | null>(demo ? 'admin' : null);
  const [orgId, setOrgId] = useState<string | null>(demo ? 'demo' : null);
  const [currentUser, setCurrentUser] = useState<Agent | null>(() => {
    const saved = localStorage.getItem('controle-qualite-user');
    if (saved) try { return JSON.parse(saved); } catch {}
    return null;
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Accepter automatiquement les invitations en attente pour mon email
      await supabase.rpc('accept_my_invitations');
      // Charger mon rôle/organisation (filtré sur mon propre user_id)
      const { data: userData } = await supabase.auth.getUser();
      const myUid = userData?.user?.id;
      let myMembership: any = null;
      if (myUid) {
        let { data: m } = await supabase.from('org_members').select('role, org_id').eq('user_id', myUid).maybeSingle();
        // Si pas d'org et nom en attente (signup avec confirmation email), créer l'org
        if (!m) {
          const pendingName = localStorage.getItem('pending-org-name');
          if (pendingName) {
            await supabase.rpc('create_my_org', { name: pendingName });
            localStorage.removeItem('pending-org-name');
            const refreshed = await supabase.from('org_members').select('role, org_id').eq('user_id', myUid).maybeSingle();
            m = refreshed.data;
          }
        }
        myMembership = m;
        setRole(m?.role || null);
        setOrgId(m?.org_id || null);
      }

      let all: any = await fetchAll();
      if (all.sites.length === 0 && all.criteres.length === 0 && myMembership) {
        await seedMocksForUser();
        all = await fetchAll();
      }
      // Renomme la table snake_case en clé camelCase attendue par AppData
      all.commentairesTypes = all.commentaires_types || [];
      delete all.commentaires_types;
      setData(all as AppData);
    } catch (e) {
      console.error('loadData', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (demo) return; // pas de Supabase en mode démo
    let loadedFor: string | null = null;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        loadedFor = session.user.id;
        loadData();
      } else {
        setLoading(false);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === 'SIGNED_OUT' || !s) {
        loadedFor = null;
        setData(EMPTY_DATA);
        setCurrentUser(null);
        return;
      }
      // Ne re-fetch que si on change vraiment d'utilisateur (pas sur TOKEN_REFRESHED)
      if (s.user.id !== loadedFor) {
        loadedFor = s.user.id;
        loadData();
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [loadData]);

  useEffect(() => {
    if (currentUser) localStorage.setItem('controle-qualite-user', JSON.stringify(currentUser));
    else localStorage.removeItem('controle-qualite-user');
  }, [currentUser]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message || null };
  };

  const signOut = async () => {
    if (demo) {
      localStorage.removeItem('demo-mode');
      window.location.href = '/';
      return;
    }
    await supabase.auth.signOut();
  };

  const stateKey = (table: string) => table === 'commentaires_types' ? 'commentairesTypes' : table;

  // Tables avec colonne org_id : on auto-remplit côté état React (le trigger SQL le fait en base).
  const ORG_SCOPED = new Set(['sites', 'locaux', 'criteres', 'agents', 'controles', 'resultats', 'actions', 'templates', 'commentaires_types']);
  const enrichOrg = (table: string, row: any) => {
    if (orgId && ORG_SCOPED.has(table) && !row.orgId) return { ...row, orgId };
    return row;
  };

  const saveRow = useCallback(async (table: any, row: any) => {
    const enriched = enrichOrg(table, row);
    if (!demo) await upsertRow(table, enriched);
    const key = stateKey(table);
    setData(prev => {
      const arr = (prev as any)[key] as any[];
      const i = arr.findIndex(r => r.id === enriched.id);
      const next = i >= 0 ? arr.map(r => r.id === enriched.id ? enriched : r) : [...arr, enriched];
      return { ...prev, [key]: next };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demo, orgId]);

  const removeRow = useCallback(async (table: any, id: string) => {
    if (!demo) await deleteRow(table, id);
    const key = stateKey(table);
    setData(prev => ({ ...prev, [key]: (prev as any)[key].filter((r: any) => r.id !== id) }));
  }, [demo]);

  const addControle = useCallback(async (controle: any, resultats: any[], actions: any[]) => {
    const c = enrichOrg('controles', controle);
    const rs = resultats.map(r => enrichOrg('resultats', r));
    const acts = actions.map(a => enrichOrg('actions', a));
    if (!demo) {
      await upsertRow('controles', c);
      if (rs.length) await upsertMany('resultats', rs);
      if (acts.length) await upsertMany('actions', acts);
      // Notif email pour chaque action ayant un responsable
      for (const a of acts) {
        if (a.responsableId) {
          supabase.functions.invoke('notify', { body: { event: 'action-creee', actionId: a.id } }).catch(() => {});
        }
      }
    }
    // Notification navigateur si actions générées
    if (acts.length > 0) {
      sendNotif(
        `Contrôle terminé`,
        `${acts.length} action${acts.length > 1 ? 's' : ''} corrective${acts.length > 1 ? 's' : ''} générée${acts.length > 1 ? 's' : ''}.`,
        { tag: 'controle-termine', url: `/controles/${c.id}` }
      );
    }
    setData(prev => ({
      ...prev,
      controles: [...prev.controles, c],
      resultats: [...prev.resultats, ...rs],
      actions: [...prev.actions, ...acts],
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demo, orgId]);

  const ownsSite = useCallback((siteId: string) => {
    if (demo) return data.sites.some((x: any) => x.id === siteId);
    const s = data.sites.find((x: any) => x.id === siteId);
    return !!s && !!orgId && (s as any).orgId === orgId;
  }, [data.sites, orgId, demo]);
  const isClientMode = !!session && !role && data.sites.length > 0;
  const isAdminOrManager = role === 'admin' || role === 'manager';

  return (
    <AppContext.Provider value={{ data, setData, session, loading, isClientMode, ownsSite, role, isAdminOrManager, orgId, currentUser, setCurrentUser, addControle, saveRow, removeRow, signIn, signOut }}>
      {children}
    </AppContext.Provider>
  );
}

function useApp() {
  const ctx = React.useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

// ========== UTILITAIRES ==========
function generateId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// @ts-expect-error reserved for later use
function formatShortDate(d: string): string {
  return new Date(d).toLocaleDateString('fr-FR', {
    month: 'short',
    day: 'numeric'
  });
}

function getSiteById(sites: Site[], id: string): Site | null {
  return sites.find(s => s.id === id) || null;
}

function getLocalById(locaux: Local[], id: string): Local | null {
  return locaux.find(l => l.id === id) || null;
}

function getCritereById(criteres: Critere[], id: string): Critere | null {
  return criteres.find(c => c.id === id) || null;
}

function getAgentById(agents: Agent[], id: string): Agent | null {
  return agents.find(a => a.id === id) || null;
}

function getControleById(controles: Controle[], id: string): Controle | null {
  return controles.find(c => c.id === id) || null;
}

function getResultatsByControle(resultats: Resultat[], controleId: string): Resultat[] {
  return resultats.filter(r => r.controleId === controleId);
}

function getActionsByControle(actions: ActionCorrective[], controleId: string): ActionCorrective[] {
  return actions.filter(a => a.controleId === controleId);
}

function getCriteresForLocal(local: Local, criteres: Critere[]): Critere[] {
  return criteres.filter(c => c.typeLocal.includes(local.type));
}

function calculateTauxConformite(
  controleId: string,
  resultats: Resultat[],
  criteres: Critere[]
): number {
  const controleResultats = resultats.filter(r => r.controleId === controleId);
  if (controleResultats.length === 0) return 0;

  let sommePonderee = 0;
  let sommeMaxPossible = 0;

  for (const r of controleResultats) {
    const c = criteres.find(cr => cr.id === r.critereId);
    if (!c || r.note === 'Non applicable') continue;
    sommePonderee += NOTE_SCORES[r.note] * c.coefficient;
    sommeMaxPossible += c.coefficient;
  }

  if (sommeMaxPossible === 0) return 0;
  return Math.round((sommePonderee / sommeMaxPossible) * 100);
}

// ========== COMPOSANTS UI ==========
function Button({
  children,
  variant = 'primary',
  onClick,
  disabled = false,
  className = '',
  icon: Icon
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  icon?: IconType;
}) {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    outline: 'border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        variants[variant]
      } ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
}

function Badge({
  children,
  variant = 'default'
}: {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}) {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800'
  };

  return (
    <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${
      variants[variant]
    }`}>
      {children}
    </span>
  );
}

function Card({
  children,
  className = ''
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-200 ${className}`}>
      {children}
    </div>
  );
}

function Input({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false
}: {
  label?: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  required = false,
  disabled = false
}: {
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <option value="">
          {label ? `Sélectionner ${label.toLowerCase()}` : 'Sélectionner'}
        </option>
        {options.map(o => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Textarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  required = false
}: {
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
}) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
      />
    </div>
  );
}

function NoteButton({
  note,
  selected,
  onSelect,
  disabled = false
}: {
  note: NoteType;
  selected: boolean;
  onSelect: (note: NoteType) => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={() => !disabled && onSelect(note)}
      disabled={disabled}
      className={`px-4 py-2.5 sm:px-3 sm:py-1.5 text-white text-sm sm:text-xs font-medium rounded-lg min-h-[44px] sm:min-h-0 ${
        NOTE_COLORS[note]
      } ${
        selected ? 'ring-2 ring-white ring-offset-2' : ''
      } ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 active:scale-95'
      }`}
    >
      {note}
    </button>
  );
}

function ConformiteGauge({
  value,
  threshold = 90
}: {
  value: number;
  threshold?: number;
}) {
  const isAbove = value >= threshold;

  return (
    <div className="relative w-24 h-12">
      <svg className="w-full h-full" viewBox="0 0 100 50">
        <path
          d="M 10 40 A 40 40 0 0 1 90 40"
          stroke="#E5E7EB"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 10 40 A 40 40 0 0 1 90 40"
          stroke={isAbove ? '#10B981' : value >= 70 ? '#F59E0B' : '#EF4444'}
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="125.6"
          strokeDashoffset={125.6 - (125.6 * (value / 100))}
          className="transition-all duration-500"
        />
        <text x="50" y="28" textAnchor="middle" className="text-lg font-bold fill-gray-900">
          {value}%
        </text>
        <text x="50" y="42" textAnchor="middle" className="text-xs fill-gray-600">
          Conformité
        </text>
      </svg>
    </div>
  );
}

// ========== PAGES ==========

// --- Dashboard ---
function DashboardPage() {
  const { data, currentUser, isClientMode, isAdminOrManager, session } = useApp();
  const navigate = useNavigate();
  const uid = session?.user?.id || '';
  const totalControles = data.controles.length;
  const now = new Date();
  const controlesDuMois = data.controles.filter(c => {
    const date = new Date(c.date);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  const actionsOuvertes = data.actions.filter(a => a.statut !== 'Soldée').length;
  const actionsEnRetard = data.actions.filter(a =>
    new Date(a.echeance) < new Date() && a.statut !== 'Soldée'
  ).length;

  const tauxParSite = data.sites.map(site => {
    const siteControles = data.controles.filter(c => c.siteId === site.id && c.tauxConformite !== null);
    const moyenne = siteControles.length > 0
      ? Math.round(siteControles.reduce((sum, c) => sum + (c.tauxConformite || 0), 0) / siteControles.length)
      : 0;
    return { site: site.nom, valeur: moyenne, seuil: site.seuilCible };
  });

  const chartData = tauxParSite.map(s => ({ name: s.site, valeur: s.valeur, seuil: s.seuil }));

  const noteData = [
    { name: 'Conforme', value: data.resultats.filter(r => r.note === 'Conforme').length, fill: '#10B981' },
    { name: 'Partiellement conforme', value: data.resultats.filter(r => r.note === 'Partiellement conforme').length, fill: '#F59E0B' },
    { name: 'Non conforme', value: data.resultats.filter(r => r.note === 'Non conforme').length, fill: '#EF4444' },
    { name: 'Non applicable', value: data.resultats.filter(r => r.note === 'Non applicable').length, fill: '#9CA3AF' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-500">
            Bienvenue {currentUser ? `${currentUser.prenom} ${currentUser.nom}` : ''}
          </p>
        </div>
        {!isClientMode && <Button onClick={() => navigate('/controles/nouveau')}>Nouveau contrôle</Button>}
      </div>

      <NotificationsBanner data={data} />
      {isDemoMode() && <OnboardingChecklist userId={uid} data={data} isAdminOrManager={isAdminOrManager} />}

      {actionsEnRetard > 0 && (
        <div
          onClick={() => navigate('/actions')}
          className="cursor-pointer p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-center gap-3 hover:bg-red-100"
        >
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-900">{actionsEnRetard} action{actionsEnRetard > 1 ? 's' : ''} en retard</p>
            <p className="text-sm text-red-700">Cliquez pour les traiter →</p>
          </div>
        </div>
      )}

      {(() => {
        const declin = sitesEnDeclin(data.sites, data.controles);
        return declin.length > 0 ? (
          <div
            onClick={() => navigate('/analytique')}
            className="cursor-pointer p-4 bg-orange-50 border-l-4 border-orange-500 rounded-lg flex items-center gap-3 hover:bg-orange-100"
          >
            <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-orange-900">{declin.length} site{declin.length > 1 ? 's' : ''} en déclin</p>
              <p className="text-sm text-orange-700">Taux en baisse 3 mois de suite — voir l'analytique →</p>
            </div>
          </div>
        ) : null;
      })()}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <ClipboardList className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Contrôles totaux</p>
              <p className="text-2xl font-bold">{totalControles}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Contrôles ce mois</p>
              <p className="text-2xl font-bold">{controlesDuMois}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Actions ouvertes</p>
              <p className="text-2xl font-bold">{actionsOuvertes}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <Clock className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Actions en retard</p>
              <p className="text-2xl font-bold">{actionsEnRetard}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold mb-4">Taux de conformité par site</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="valeur" name="Taux moyen" fill="#3B82F6" />
                <ReferenceLine y={90} stroke="#EF4444" strokeDasharray="3 3" label="Seuil" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold mb-4">Répartition des notes</h2>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={noteData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={60}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {noteData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={noteData[index].fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}

// --- Login ---
function LoginPage() {
  const { signIn, session } = useApp();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  // Si déjà connecté, redirige vers le dashboard
  useEffect(() => {
    if (session) navigate('/');
  }, [session, navigate]);

  const reset = () => { setError(''); setInfo(''); };

  const handleLogin = async (e: any) => {
    e.preventDefault(); reset(); setBusy(true);
    localStorage.removeItem('demo-mode');
    const { error } = await signIn(email, password);
    setBusy(false);
    if (error) setError(error);
  };

  const handleDemo = () => {
    localStorage.setItem('demo-mode', '1');
    Object.keys(localStorage).forEach(k => { if (k.startsWith('welcome-seen-') || k.startsWith('onboarding-dismissed-')) localStorage.removeItem(k); });
    window.location.href = '/';
  };

  const handleSignup = async (e: any) => {
    e.preventDefault(); reset(); setBusy(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      // Si pas de session (confirmation email requise)
      if (!data.session) {
        setInfo('Compte créé ! Vérifiez votre email pour confirmer votre adresse, puis revenez vous connecter.');
        localStorage.setItem('pending-org-name', orgName);
        setBusy(false);
        return;
      }
      // Session active : créer l'org tout de suite (sauf si invitation en attente)
      await supabase.rpc('accept_my_invitations');
      const { data: existing } = await supabase.from('org_members').select('org_id').eq('user_id', data.user!.id).maybeSingle();
      if (!existing && orgName.trim()) {
        await supabase.rpc('create_my_org', { name: orgName });
      }
      // loadData se déclenchera via onAuthStateChange
      window.location.reload();
    } catch (e: any) {
      setError(e?.message || String(e));
      setBusy(false);
    }
  };

  const handleForgot = async (e: any) => {
    e.preventDefault(); reset(); setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
      if (error) throw error;
      setInfo('Email de réinitialisation envoyé. Vérifiez votre boîte.');
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <Building2 className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Contrôle Qualité Propreté</h1>
          <p className="text-gray-500 mt-2">
            {mode === 'login' && 'Connectez-vous pour continuer'}
            {mode === 'signup' && 'Créez votre compte'}
            {mode === 'forgot' && 'Réinitialiser votre mot de passe'}
          </p>
        </div>
        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4 text-sm text-red-600">{error}</div>}
        {info && <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-4 text-sm text-green-700">{info}</div>}

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <Input label="Email" type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} required />
            <Input label="Mot de passe" type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} required />
            <Button onClick={handleLogin as any} disabled={busy} className="w-full">{busy ? '...' : 'Se connecter'}</Button>
            <div className="flex justify-between text-sm pt-2">
              <button type="button" onClick={() => { reset(); setMode('signup'); }} className="text-blue-600 hover:underline">Créer un compte</button>
              <button type="button" onClick={() => { reset(); setMode('forgot'); }} className="text-blue-600 hover:underline">Mot de passe oublié ?</button>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <button type="button" onClick={handleDemo} disabled={busy} className="w-full text-sm bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50">
                🚀 Voir la démo sans inscription
              </button>
              <p className="text-xs text-gray-400 text-center mt-2">Explorez l'app avec des données fictives</p>
            </div>
          </form>
        )}

        {mode === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-4">
            <Input label="Email" type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} required />
            <Input label="Mot de passe" type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} required />
            <Input label="Nom de votre société" value={orgName} onChange={(e: any) => setOrgName(e.target.value)} placeholder="ex: Propreté Service SARL" />
            <p className="text-xs text-gray-500">Si vous avez reçu une invitation, laissez ce champ vide — vous rejoindrez l'organisation qui vous a invité.</p>
            <Button onClick={handleSignup as any} disabled={busy} className="w-full">{busy ? '...' : 'Créer mon compte'}</Button>
            <button type="button" onClick={() => { reset(); setMode('login'); }} className="text-sm text-blue-600 hover:underline w-full text-center">Déjà un compte ? Se connecter</button>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleForgot} className="space-y-4">
            <Input label="Email" type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} required />
            <Button onClick={handleForgot as any} disabled={busy} className="w-full">{busy ? '...' : 'Envoyer le lien'}</Button>
            <button type="button" onClick={() => { reset(); setMode('login'); }} className="text-sm text-blue-600 hover:underline w-full text-center">Retour à la connexion</button>
          </form>
        )}
      </Card>
    </div>
  );
}

// --- Nouveau Contrôle ---
function NouveauControlePage() {
  const { data, addControle, saveRow, removeRow, currentUser } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const siteIdParam = params.get('siteId') || '';
  const planifieId = params.get('planifieId') || '';
  const brouillonId = params.get('brouillonId') || '';
  const planifie = planifieId ? data.controles.find((c: any) => c.id === planifieId) : null;
  const brouillon = brouillonId ? data.controles.find((c: any) => c.id === brouillonId) : null;
  const brouillonResultats = brouillon ? data.resultats.filter((r: any) => r.controleId === brouillon.id) : [];

  const [step, setStep] = useState(brouillon ? 2 : 1);
  const [controle, setControle] = useState<any>(() => brouillon
    ? { ...brouillon }
    : {
        id: generateId(),
        siteId: planifie?.siteId || siteIdParam,
        date: new Date().toISOString().split('T')[0],
        type: planifie?.type || 'Programmé',
        statut: 'Brouillon',
        controleurId: currentUser?.id || '',
        agentEvalueId: '',
        tauxConformite: null,
        commentaireGeneral: '',
        createdAt: new Date().toISOString()
      });
  const DRAFT_KEY = 'controle-draft-' + (controle.siteId || 'new');
  const [selectedLocaux, setSelectedLocaux] = useState<string[]>(() => {
    if (brouillon) return [...new Set(brouillonResultats.map((r: any) => r.localId))] as string[];
    try { const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); return d?.selectedLocaux || []; } catch { return []; }
  });
  const [resultats, setResultats] = useState<any[]>(() => {
    if (brouillon) return brouillonResultats;
    try { const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); return d?.resultats || []; } catch { return []; }
  });
  const [currentLocalIndex, setCurrentLocalIndex] = useState(0);
  const [savingDraft, setSavingDraft] = useState(false);

  // Auto-save brouillon (mode hors-ligne friendly)
  useEffect(() => {
    if (selectedLocaux.length || resultats.length) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ controle, selectedLocaux, resultats, currentLocalIndex }));
    }
  }, [controle, selectedLocaux, resultats, currentLocalIndex, DRAFT_KEY]);

  // Pré-remplit locaux + agent depuis le dernier contrôle du site
  useEffect(() => {
    if (!controle.siteId || brouillon) return;
    const last = data.controles
      .filter((c: any) => c.id !== controle.id && c.statut !== 'Brouillon' && c.statut !== 'Planifié')
      .filter((c: any) => c.siteId === controle.siteId)
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    if (!last) return;
    const lastLocaux = [...new Set(
      data.resultats.filter((r: any) => r.controleId === last.id).map((r: any) => r.localId)
    )].filter(id => data.locaux.some((l: any) => l.id === id && l.siteId === controle.siteId));
    if (lastLocaux.length && selectedLocaux.length === 0) setSelectedLocaux(lastLocaux as string[]);
    if (last.agentEvalueId && !controle.agentEvalueId) {
      setControle((prev: any) => ({ ...prev, agentEvalueId: last.agentEvalueId }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controle.siteId]);

  const locauxDuSite = data.locaux.filter((l: any) => l.siteId === controle.siteId);
  const agentsDuSite = data.agents.filter((a: any) => a.siteId === controle.siteId);
  const selectedLocauxObjs = selectedLocaux.map(id => locauxDuSite.find((l: any) => l.id === id)).filter(Boolean);
  const currentLocal = selectedLocauxObjs[currentLocalIndex];
  const criteresPourLocal = currentLocal ? getCriteresForLocal(currentLocal, data.criteres) : [];

  const tauxCalcule = useMemo(() =>
    calculateTauxConformite(controle.id, resultats, data.criteres),
    [resultats, data.criteres, controle.id]
  );

  const handleToggleLocal = (localId: string) => {
    setSelectedLocaux(prev => prev.includes(localId)
      ? prev.filter(id => id !== localId)
      : [...prev, localId]);
  };

  const handleSetNote = (critereId: string, note: any) => {
    setResultats(prev => {
      const i = prev.findIndex(r => r.critereId === critereId && r.localId === currentLocal?.id);
      if (i >= 0) {
        const nr = [...prev];
        nr[i] = { ...nr[i], note };
        return nr;
      }
      return [...prev, {
        id: generateId(),
        controleId: controle.id,
        critereId,
        localId: currentLocal?.id || '',
        note,
        photo: null,
        commentaire: ''
      }];
    });
  };

  const handleSetCommentaire = (critereId: string, commentaire: string) => {
    setResultats(prev => {
      const i = prev.findIndex(r => r.critereId === critereId && r.localId === currentLocal?.id);
      if (i >= 0) {
        const nr = [...prev];
        nr[i] = { ...nr[i], commentaire };
        return nr;
      }
      return [...prev, {
        id: generateId(),
        controleId: controle.id,
        critereId,
        localId: currentLocal?.id || '',
        note: 'Conforme',
        photo: null,
        commentaire
      }];
    });
  };

  const handleNext = () => {
    if (step === 1) {
      if (!controle.siteId || !controle.type || !controle.agentEvalueId) {
        alert('Veuillez remplir tous les champs obligatoires');
        return;
      }
      if (selectedLocaux.length === 0) {
        alert('Veuillez sélectionner au moins un local');
        return;
      }
      setStep(2);
    }
    else if (step === 2) {
      const hasMissing = criteresPourLocal.some((c: any) =>
        !resultats.some(r => r.critereId === c.id && r.localId === currentLocal?.id)
      );
      if (hasMissing) {
        alert('Veuillez noter tous les critères pour ce local');
        return;
      }
      if (currentLocalIndex < selectedLocaux.length - 1) {
        setCurrentLocalIndex(currentLocalIndex + 1);
      } else {
        setStep(3);
      }
    }
    else if (step === 3) {
      const nc = { ...controle, tauxConformite: tauxCalcule, statut: 'Terminé' };
      const finalResultats = resultats.map(r => ({ ...r, id: r.id || generateId() }));
      const newActions = resultats
        .filter(r => r.note === 'Non conforme')
        .map(r => ({
          id: generateId(),
          controleId: nc.id,
          descriptionNc: `Non-conformité: ${getCritereById(data.criteres, r.critereId)?.libelle || 'Critère inconnu'}`,
          action: 'À définir',
          responsableId: nc.agentEvalueId,
          echeance: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          statut: 'Ouverte',
        }));

      (async () => {
        try {
          if (brouillon) {
            await saveRow('controles', nc);
            for (const r of finalResultats) await saveRow('resultats', r);
            for (const a of newActions) await saveRow('actions', a);
          } else {
            await addControle(nc, finalResultats, newActions);
          }
          if (planifieId) await removeRow('controles', planifieId);
          localStorage.removeItem(DRAFT_KEY);
          navigate(`/controles/${nc.id}`);
        } catch (e: any) {
          alert('Erreur sauvegarde: ' + (e.message || e));
        }
      })();
    }
  };

  const handleSaveDraft = async () => {
    if (!controle.siteId) { alert('Choisissez un site avant de sauvegarder.'); return; }
    setSavingDraft(true);
    try {
      const draft = { ...controle, statut: 'Brouillon', tauxConformite: tauxCalcule || null };
      const finalResultats = resultats.map(r => ({ ...r, id: r.id || generateId() }));
      await saveRow('controles', draft);
      for (const r of finalResultats) await saveRow('resultats', r);
      localStorage.removeItem(DRAFT_KEY);
      navigate('/controles');
    } catch (e: any) {
      alert('Erreur : ' + (e?.message || e));
    } finally {
      setSavingDraft(false);
    }
  };

  const handlePrev = () => {
    if (step === 2) {
      if (currentLocalIndex > 0) {
        setCurrentLocalIndex(currentLocalIndex - 1);
      } else {
        setStep(1);
      }
    } else if (step > 1) {
      setStep(prev => prev - 1);
    } else {
      navigate('/sites');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 justify-between flex-wrap">
        <div className="flex items-center gap-4">
          <button onClick={handlePrev} className="p-2 hover:bg-gray-100 rounded-lg">
            {step > 1 ? <ChevronLeft /> : <Home />}
          </button>
          <div>
            <h1 className="text-2xl font-bold">{brouillon ? 'Reprendre le brouillon' : 'Nouveau contrôle'}</h1>
            <p className="text-gray-500">Étape {step} sur 3</p>
          </div>
        </div>
        {step >= 2 && (
          <Button variant="secondary" onClick={handleSaveDraft} disabled={savingDraft}>
            {savingDraft ? '...' : '💾 Sauvegarder comme brouillon'}
          </Button>
        )}
      </div>

      <div className="flex gap-2 mb-6">
        {[1, 2, 3].map(s => (
          <div
            key={s}
            className={`h-2 flex-1 rounded-full ${s <= step ? 'bg-blue-500' : 'bg-gray-200'}`}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <Card>
            <h2 className="text-lg font-semibold mb-4">Informations du contrôle</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Site"
                value={controle.siteId}
                onChange={(e: any) => setControle({...controle, siteId: e.target.value, agentEvalueId: ''})}
                options={data.sites.map((s: any) => ({ value: s.id, label: s.nom }))}
                required
              />
              <Select
                label="Type de contrôle"
                value={controle.type}
                onChange={(e: any) => setControle({...controle, type: e.target.value})}
                options={[
                  { value: 'Programmé', label: 'Programmé' },
                  { value: 'Inopiné', label: 'Inopiné' },
                  { value: 'Contradictoire client', label: 'Contradictoire client' }
                ]}
                required
              />
              <Input
                label="Date"
                type="date"
                value={controle.date || ''}
                onChange={(e: any) => setControle({...controle, date: e.target.value})}
                required
              />
              <Select
                label="Agent évalué"
                value={controle.agentEvalueId}
                onChange={(e: any) => setControle({...controle, agentEvalueId: e.target.value})}
                options={agentsDuSite.map((a: any) => ({ value: a.id, label: `${a.prenom} ${a.nom}` }))}
                required
              />
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold mb-4">Locaux à contrôler</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {locauxDuSite.map((local: any) => {
                const isSelected = selectedLocaux.includes(local.id);
                return (
                  <div
                    key={local.id}
                    onClick={() => handleToggleLocal(local.id)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleLocal(local.id)}
                        className="w-4 h-4"
                      />
                      <div>
                        <p className="font-medium">{local.nom}</p>
                        <p className="text-sm text-gray-500">
                          {local.type} - {local.surface}m² - {local.etage}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleNext}>Continuer →</Button>
          </div>
        </div>
      )}

      {step === 2 && currentLocal && (
        <div className="space-y-4">
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">{currentLocal.nom}</h2>
              <Badge variant="info">
                {currentLocal.type} - {currentLocal.surface}m² - {currentLocal.etage}
              </Badge>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Local {currentLocalIndex + 1} / {selectedLocaux.length}
            </p>

            <div className="mb-4">
              <div className="h-2 bg-gray-200 rounded-full">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{
                    width: `${criteresPourLocal.length ? (resultats.filter(r => r.localId === currentLocal.id).length / criteresPourLocal.length) * 100 : 0}%`
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {resultats.filter(r => r.localId === currentLocal.id).length} / {criteresPourLocal.length} critères notés
              </p>
            </div>

            <div className="space-y-4">
              {criteresPourLocal.map((critere: any, index: number) => {
                const resultat = resultats.find(r =>
                  r.critereId === critere.id && r.localId === currentLocal.id
                );
                const note = resultat?.note;

                return (
                  <div key={critere.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-medium">{index + 1}. {critere.libelle}</p>
                        <p className="text-xs text-gray-500">
                          {critere.categorie} - Coefficient: {critere.coefficient}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {(['Conforme', 'Partiellement conforme', 'Non conforme', 'Non applicable'] as const).map(n => (
                        <NoteButton
                          key={n}
                          note={n}
                          selected={note === n}
                          onSelect={(nn: any) => handleSetNote(critere.id, nn)}
                        />
                      ))}
                    </div>

                    <div className="mt-3">
                      <Textarea
                        label="Commentaire"
                        value={resultat?.commentaire || ''}
                        onChange={(e: any) => handleSetCommentaire(critere.id, e.target.value)}
                        placeholder="Ajouter un commentaire..."
                        rows={2}
                      />
                      <div className="flex flex-wrap gap-1 mt-2 items-center">
                        {data.commentairesTypes
                          .filter((t: any) => !t.note || t.note === (resultat?.note || 'Conforme'))
                          .slice(0, 6)
                          .map((t: any) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => handleSetCommentaire(critere.id, ((resultat?.commentaire || '') + ' ' + t.libelle).trim())}
                              className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-2 rounded-full hover:bg-blue-100 active:scale-95"
                            >+ {t.libelle}</button>
                          ))}
                        <VoiceButton onResult={(text) => handleSetCommentaire(critere.id, ((resultat?.commentaire || '') + ' ' + text).trim())} />
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-3">
                      <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 active:scale-95 text-sm min-h-[44px]">
                        <Camera className="w-4 h-4" />
                        Photo
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            try {
                              const url = await uploadPhoto(f);
                              setResultats(prev => {
                                const i = prev.findIndex(r => r.critereId === critere.id && r.localId === currentLocal.id);
                                if (i >= 0) {
                                  const nr = [...prev];
                                  nr[i] = { ...nr[i], photo: url };
                                  return nr;
                                }
                                return [...prev, { id: generateId(), controleId: controle.id, critereId: critere.id, localId: currentLocal.id, note: 'Conforme', photo: url, commentaire: '' }];
                              });
                            } catch (err: any) {
                              alert('Erreur upload: ' + (err.message || err));
                            }
                          }}
                        />
                      </label>
                      {resultat?.photo && (
                        <img src={resultat.photo} alt="" className="w-16 h-16 object-cover rounded border" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <div className="flex justify-between">
            <Button variant="secondary" onClick={handlePrev}>← Retour</Button>
            <Button onClick={handleNext}>
              {currentLocalIndex < selectedLocaux.length - 1 ? 'Local suivant →' : 'Continuer →'}
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <Card>
            <h2 className="text-lg font-semibold mb-4">Récapitulatif du contrôle</h2>

            <div className="p-4 bg-gray-50 rounded-lg mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Informations générales</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Site</p>
                  <p className="font-medium">{getSiteById(data.sites, controle.siteId)?.nom}</p>
                </div>
                <div>
                  <p className="text-gray-500">Type de contrôle</p>
                  <Badge variant="info">{controle.type}</Badge>
                </div>
                <div>
                  <p className="text-gray-500">Date</p>
                  <p className="font-medium">{formatDate(controle.date || '')}</p>
                </div>
                <div>
                  <p className="text-gray-500">Agent évalué</p>
                  <p className="font-medium">
                    {getAgentById(data.agents, controle.agentEvalueId)?.prenom || ''}{' '}
                    {getAgentById(data.agents, controle.agentEvalueId)?.nom || 'Inconnu'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg mb-6 text-center">
              <h3 className="font-medium text-gray-900 mb-3">Taux de conformité calculé</h3>
              <div className="flex items-center justify-center gap-4">
                <ConformiteGauge value={tauxCalcule || 0} />
                <div>
                  <p className="text-4xl font-bold">{tauxCalcule || 0}%</p>
                </div>
              </div>
            </div>

            <Textarea
              label="Commentaire général"
              value={controle.commentaireGeneral || ''}
              onChange={(e: any) => setControle({...controle, commentaireGeneral: e.target.value})}
              placeholder="Ajouter un commentaire général..."
              rows={3}
            />
          </Card>

          <div className="flex justify-between">
            <Button variant="secondary" onClick={handlePrev}>← Retour</Button>
            <Button onClick={handleNext}>Valider le contrôle ✓</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Contrôles ---
function ControlesPage() {
  const { data, isClientMode } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterSite, setFilterSite] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minTaux, setMinTaux] = useState('');
  const [maxTaux, setMaxTaux] = useState('');

  const filtered = data.controles.filter((c: any) => {
    if (c.statut === 'Planifié') return false;
    const site = getSiteById(data.sites, c.siteId);
    if (search && !(site?.nom.toLowerCase().includes(search.toLowerCase()) || c.type.toLowerCase().includes(search.toLowerCase()))) return false;
    if (filterSite && c.siteId !== filterSite) return false;
    if (filterStatut && c.statut !== filterStatut) return false;
    if (dateFrom && c.date < dateFrom) return false;
    if (dateTo && c.date > dateTo) return false;
    const t = c.tauxConformite ?? -1;
    if (minTaux && t < parseInt(minTaux)) return false;
    if (maxTaux && t > parseInt(maxTaux)) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Contrôles</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => exportControlesExcel({ controles: data.controles, sites: data.sites, agents: data.agents, resultats: data.resultats, criteres: data.criteres, locaux: data.locaux, actions: data.actions })}>
            Export Excel
          </Button>
          {!isClientMode && <Button onClick={() => navigate('/controles/nouveau')}>Nouveau contrôle</Button>}
        </div>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Rechercher"
            value={search}
            onChange={(e: any) => setSearch(e.target.value)}
            placeholder="Site, type..."
          />
          <Select
            label="Site"
            value={filterSite}
            onChange={(e: any) => setFilterSite(e.target.value)}
            options={data.sites.map((s: any) => ({ value: s.id, label: s.nom }))}
          />
          <Select
            label="Statut"
            value={filterStatut}
            onChange={(e: any) => setFilterStatut(e.target.value)}
            options={[
              { value: 'Brouillon', label: 'Brouillon' },
              { value: 'Terminé', label: 'Terminé' },
              { value: 'Validé', label: 'Validé' }
            ]}
          />
          <Input label="Du" type="date" value={dateFrom} onChange={(e: any) => setDateFrom(e.target.value)} />
          <Input label="Au" type="date" value={dateTo} onChange={(e: any) => setDateTo(e.target.value)} />
          <Input label="Taux min (%)" type="number" value={minTaux} onChange={(e: any) => setMinTaux(e.target.value)} />
          <Input label="Taux max (%)" type="number" value={maxTaux} onChange={(e: any) => setMaxTaux(e.target.value)} />
        </div>
        {(search || filterSite || filterStatut || dateFrom || dateTo || minTaux || maxTaux) && (
          <button onClick={() => { setSearch(''); setFilterSite(''); setFilterStatut(''); setDateFrom(''); setDateTo(''); setMinTaux(''); setMaxTaux(''); }} className="text-sm text-blue-600 hover:underline mt-3">Réinitialiser les filtres</button>
        )}
      </Card>

      <div className="space-y-4">
        {filtered.length > 0 ? (
          filtered
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((c: any) => {
              const site = getSiteById(data.sites, c.siteId);
              const agent = getAgentById(data.agents, c.agentEvalueId);
              return (
                <Card key={c.id}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{c.type}</h3>
                        <Badge variant={c.statut === 'Validé' ? 'success' : c.statut === 'Terminé' ? 'info' : 'default'}>
                          {c.statut}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{site?.nom} - {formatDate(c.date)}</p>
                      <p className="text-sm mt-1">Agent: {agent ? `${agent.prenom} ${agent.nom}` : 'Inconnu'}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {c.tauxConformite !== null && (
                        <ConformiteGauge value={c.tauxConformite} threshold={site?.seuilCible || 90} />
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex gap-3">
                    <Link to={`/controles/${c.id}`} className="text-sm text-blue-600 hover:underline">
                      Voir les détails →
                    </Link>
                    {c.statut === 'Brouillon' && (
                      <Link to={`/controles/nouveau?brouillonId=${c.id}`} className="text-sm text-orange-600 hover:underline font-medium">
                        ▶ Reprendre la saisie
                      </Link>
                    )}
                  </div>
                </Card>
              );
            })
        ) : (
          <Card className="text-center py-8">
            <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Aucun contrôle trouvé</p>
          </Card>
        )}
      </div>
    </div>
  );
}

// --- Détail Contrôle ---
function ControleDetailPage() {
  const { data, saveRow, orgId } = useApp();
  const { id } = useParams();
  const navigate = useNavigate();
  const controle = getControleById(data.controles, id || '');
  const [sigControleur, setSigControleur] = useState<string | null>(controle?.signatureControleur || null);
  const [sigAgent, setSigAgent] = useState<string | null>(controle?.signatureAgent || null);
  const [busy, setBusy] = useState(false);

  if (!controle) {
    return (
      <Card className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-500">Contrôle non trouvé</p>
        <Button onClick={() => navigate('/controles')}>Retour aux contrôles</Button>
      </Card>
    );
  }

  const site = getSiteById(data.sites, controle.siteId);
  const agent = getAgentById(data.agents, controle.agentEvalueId);
  const resultats = getResultatsByControle(data.resultats, controle.id);
  const actions = getActionsByControle(data.actions, controle.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 justify-between flex-wrap">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/controles')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronLeft />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Contrôle {controle.type}</h1>
            <p className="text-gray-500">{formatDate(controle.date)}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {controle.statut === 'Brouillon' && (
            <Button onClick={() => navigate(`/controles/nouveau?brouillonId=${controle.id}`)}>
              ▶ Reprendre la saisie
            </Button>
          )}
          <Button variant="secondary" onClick={async () => {
            try {
              await exportControlePdf({ controle, site, agent, resultats, actions, criteres: data.criteres, locaux: data.locaux });
            } catch (e: any) {
              alert('Erreur PDF: ' + (e?.message || e));
            }
          }}>
            Exporter PDF
          </Button>
          <Button onClick={async () => {
            if (!site?.emailClient && !confirm('Aucun email client. Ouvrir un email vide ?')) return;
            try {
              await exportControlePdf({ controle, site, agent, resultats, actions, criteres: data.criteres, locaux: data.locaux });
              const sujet = encodeURIComponent(`Rapport contrôle - ${site?.nom} - ${formatDate(controle.date)}`);
              const taux = controle.tauxConformite ?? 0;
              const corps = encodeURIComponent(
                `Bonjour,\n\nVeuillez trouver le rapport du contrôle du ${formatDate(controle.date)} sur ${site?.nom}.\n\nTaux : ${taux}%\nActions ouvertes : ${actions.filter((a: any) => a.statut !== 'Soldée').length}\n\nPDF téléchargé — à joindre.\n\nCordialement`
              );
              window.location.href = `mailto:${site?.emailClient || ''}?subject=${sujet}&body=${corps}`;
            } catch (e: any) { alert('Erreur: ' + (e?.message || e)); }
          }}>
            📧 Envoyer
          </Button>
          <Button variant="outline" onClick={async () => {
            if (isDemoMode()) {
              alert('🚀 Mode démo — Le lien client public n\'est pas disponible.\n\nCréez un compte gratuit pour générer des liens partageables à vos clients (valides 90 jours, sans inscription pour eux).');
              return;
            }
            try {
              const { data: link, error } = await supabase
                .from('public_share_links')
                .insert({ controle_id: controle.id, org_id: orgId, expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() })
                .select()
                .single();
              if (error) throw error;
              const url = `${window.location.origin}/public/${link.token}`;
              await navigator.clipboard.writeText(url);
              alert(`Lien copié dans le presse-papier :\n\n${url}\n\nValide 90 jours, à transmettre au client.`);
            } catch (e: any) { alert('Erreur: ' + (e?.message || e)); }
          }}>
            🔗 Lien client
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="text-center">
          <p className="text-sm text-gray-500">Taux de conformité</p>
          <ConformiteGauge value={controle.tauxConformite || 0} threshold={site?.seuilCible || 90} />
        </Card>
        <Card className="text-center">
          <p className="text-sm text-gray-500">Statut</p>
          <Badge variant={controle.statut === 'Validé' ? 'success' : controle.statut === 'Terminé' ? 'info' : 'default'}>
            {controle.statut}
          </Badge>
        </Card>
        <Card className="text-center">
          <p className="text-sm text-gray-500">Actions correctives</p>
          <p className="text-2xl font-bold">{actions.length}</p>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-semibold mb-4">Informations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div><p className="text-gray-500">Site</p><p className="font-medium">{site?.nom}</p></div>
          <div><p className="text-gray-500">Agent évalué</p><p className="font-medium">{agent ? `${agent.prenom} ${agent.nom}` : 'Inconnu'}</p></div>
        </div>
        {controle.commentaireGeneral && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-2">Commentaire général</p>
            <p className="p-3 bg-gray-50 rounded-lg">{controle.commentaireGeneral}</p>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-lg font-semibold mb-4">Résultats ({resultats.length})</h2>
        <div className="space-y-2">
          {resultats.map((r: any) => {
            const critere = getCritereById(data.criteres, r.critereId);
            const local = getLocalById(data.locaux, r.localId);
            return (
              <div key={r.id} className="p-2 bg-gray-50 rounded border border-gray-200 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">{critere?.libelle}</p>
                  <p className="text-xs text-gray-500">{local?.nom}</p>
                </div>
                <NoteButton note={r.note} selected disabled onSelect={() => {}} />
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold mb-4">Signatures</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SignaturePad label="Contrôleur" value={sigControleur} onChange={setSigControleur} />
          <SignaturePad label="Agent évalué" value={sigAgent} onChange={setSigAgent} />
        </div>
        <div className="flex justify-end mt-4">
          <Button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await saveRow('controles', {
                  ...controle,
                  signatureControleur: sigControleur,
                  signatureAgent: sigAgent,
                  statut: sigControleur && sigAgent ? 'Validé' : controle.statut,
                });
                alert('Signatures enregistrées');
              } catch (e: any) {
                alert('Erreur: ' + (e?.message || JSON.stringify(e)));
              } finally { setBusy(false); }
            }}
          >
            {busy ? '...' : 'Enregistrer les signatures'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

// --- Actions ---
function ActionRow({ a }: { a: any }) {
  const { data, saveRow, removeRow } = useApp();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(a);
  const responsable = getAgentById(data.agents, a.responsableId);
  const isOverdue = new Date(a.echeance) < new Date() && a.statut !== 'Soldée';

  const save = async () => {
    await saveRow('actions', form);
    setEditing(false);
  };

  const changeStatut = async (statut: string) => {
    await saveRow('actions', { ...a, statut });
  };

  return (
    <Card className={isOverdue ? 'border-l-4 border-l-red-500' : ''}>
      {editing ? (
        <div className="space-y-3">
          <Textarea label="Description" value={form.descriptionNc} onChange={(e: any) => setForm({ ...form, descriptionNc: e.target.value })} rows={2} />
          <Textarea label="Action" value={form.action} onChange={(e: any) => setForm({ ...form, action: e.target.value })} rows={2} />
          <Input label="Échéance" type="date" value={form.echeance} onChange={(e: any) => setForm({ ...form, echeance: e.target.value })} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => { setForm(a); setEditing(false); }}>Annuler</Button>
            <Button onClick={save}>Enregistrer</Button>
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <p className="font-medium">{a.descriptionNc}</p>
            <p className="text-sm text-gray-700">{a.action}</p>
            <p className="text-xs text-gray-500 mt-1">
              {responsable ? `${responsable.prenom} ${responsable.nom}` : 'Inconnu'} · Échéance: {formatDate(a.echeance)}
              {isOverdue && <span className="text-red-600 font-medium ml-1">(en retard)</span>}
            </p>
            <div className="flex gap-2 mt-3">
              {(['Ouverte', 'En cours', 'Soldée'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => changeStatut(s)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-full border ${
                    a.statut === s
                      ? (s === 'Soldée' ? 'bg-green-100 text-green-800 border-green-300' : s === 'En cours' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : 'bg-red-100 text-red-800 border-red-300')
                      : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'
                  }`}
                >{s}</button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1 text-sm">
            <button onClick={() => setEditing(true)} className="text-blue-600 hover:underline">Modifier</button>
            {responsable?.email && (
              <a
                href={`mailto:${responsable.email}?subject=${encodeURIComponent('Action corrective à traiter')}&body=${encodeURIComponent(`Bonjour ${responsable.prenom},\n\nUne action corrective t'a été assignée :\n\n${a.descriptionNc}\nAction à réaliser : ${a.action}\nÉchéance : ${a.echeance}\n\nMerci.`)}`}
                className="text-blue-600 hover:underline"
              >Notifier</a>
            )}
            <button onClick={() => confirm('Supprimer cette action ?') && removeRow('actions', a.id)} className="text-red-600 hover:underline">Suppr.</button>
          </div>
        </div>
      )}
    </Card>
  );
}

function ActionsPage() {
  const { data } = useApp();
  const [filterStatut, setFilterStatut] = useState('');
  const [showOnlyOverdue, setShowOnlyOverdue] = useState(false);

  const filtered = data.actions
    .filter((a: any) => {
      const isOverdue = new Date(a.echeance) < new Date() && a.statut !== 'Soldée';
      return (filterStatut === '' || a.statut === filterStatut) && (!showOnlyOverdue || isOverdue);
    })
    .sort((a: any, b: any) => {
      const aO = new Date(a.echeance) < new Date() && a.statut !== 'Soldée';
      const bO = new Date(b.echeance) < new Date() && b.statut !== 'Soldée';
      if (aO !== bO) return aO ? -1 : 1;
      return new Date(a.echeance).getTime() - new Date(b.echeance).getTime();
    });

  const counts = {
    total: data.actions.length,
    ouvertes: data.actions.filter((a: any) => a.statut === 'Ouverte').length,
    encours: data.actions.filter((a: any) => a.statut === 'En cours').length,
    soldees: data.actions.filter((a: any) => a.statut === 'Soldée').length,
    retard: data.actions.filter((a: any) => new Date(a.echeance) < new Date() && a.statut !== 'Soldée').length,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Actions correctives</h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="text-center !p-3"><p className="text-xs text-gray-500">Total</p><p className="text-xl font-bold">{counts.total}</p></Card>
        <Card className="text-center !p-3"><p className="text-xs text-gray-500">Ouvertes</p><p className="text-xl font-bold text-red-600">{counts.ouvertes}</p></Card>
        <Card className="text-center !p-3"><p className="text-xs text-gray-500">En cours</p><p className="text-xl font-bold text-yellow-600">{counts.encours}</p></Card>
        <Card className="text-center !p-3"><p className="text-xs text-gray-500">Soldées</p><p className="text-xl font-bold text-green-600">{counts.soldees}</p></Card>
        <Card className="text-center !p-3"><p className="text-xs text-gray-500">En retard</p><p className="text-xl font-bold text-red-600">{counts.retard}</p></Card>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <Select
            label="Filtrer par statut"
            value={filterStatut}
            onChange={(e: any) => setFilterStatut(e.target.value)}
            options={[
              { value: '', label: 'Tous' },
              { value: 'Ouverte', label: 'Ouverte' },
              { value: 'En cours', label: 'En cours' },
              { value: 'Soldée', label: 'Soldée' },
            ]}
          />
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={showOnlyOverdue} onChange={e => setShowOnlyOverdue(e.target.checked)} className="w-4 h-4" />
            <span className="text-sm">En retard uniquement</span>
          </label>
        </div>
      </Card>

      <div className="space-y-3">
        {filtered.length > 0
          ? filtered.map((a: any) => <ActionRow key={a.id} a={a} />)
          : <Card className="text-center py-8"><AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" /><p className="text-gray-500">Aucune action</p></Card>
        }
      </div>
    </div>
  );
}

// --- Sites ---
function SitesPage() {
  const { data, isClientMode, isAdminOrManager } = useApp();
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h1 className="text-2xl font-bold">{isClientMode ? 'Mes sites' : 'Sites'}</h1>
        {isAdminOrManager && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate('/sites/import')}>📥 Importer Excel</Button>
            <Button onClick={() => navigate('/sites/nouveau')}>+ Nouveau site</Button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.sites.map((site: any) => (
          <Card key={site.id}>
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{site.nom}</h3>
                <p className="text-sm text-gray-500">{site.ville} - {site.client}</p>
                <Badge variant="info">{site.frequenceControle}</Badge>
              </div>
            </div>
            <div className="mt-3">
              <Link to={`/sites/${site.id}`} className="text-sm text-blue-600 hover:underline">Voir les détails →</Link>
            </div>
          </Card>
        ))}
        {data.sites.length === 0 && (
          <Card className="text-center py-8 md:col-span-2">
            <p className="text-gray-500">Aucun site. Crée le premier.</p>
          </Card>
        )}
      </div>
    </div>
  );
}

// --- Import Excel ---
function SitesImportPage() {
  const { data, saveRow, isAdminOrManager } = useApp();
  const navigate = useNavigate();
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [importing, setImporting] = useState(false);

  if (!isAdminOrManager) return <Card className="text-center py-8"><p>Accès réservé aux admins/managers.</p></Card>;

  const handleFile = async (file: File) => {
    try {
      const p = await parseImportFile(file, data.sites);
      setPreview(p);
    } catch (e: any) {
      alert('Erreur lecture fichier : ' + e.message);
    }
  };

  const doImport = async () => {
    if (!preview) return;
    setImporting(true);
    try {
      // 1. Sites (skip duplicates)
      const newSites = preview.sites.filter(s => !s.isDuplicate);
      const siteByName = new Map<string, string>();
      data.sites.forEach((s: any) => siteByName.set(s.nom.toLowerCase().trim(), s.id));
      for (const s of newSites) {
        const id = generateId();
        siteByName.set(s.nom.toLowerCase().trim(), id);
        await saveRow('sites', {
          id, nom: s.nom, client: s.client, adresse: s.adresse, ville: s.ville,
          responsableSecteur: s.responsableSecteur, frequenceControle: s.frequenceControle,
          seuilCible: s.seuilCible, emailClient: s.emailClient,
        });
      }
      // 2. Locaux pour sites existants ou nouvellement créés
      const okLocaux = preview.locaux.filter(l => siteByName.has(l.siteNom.toLowerCase().trim()));
      for (const l of okLocaux) {
        const siteId = siteByName.get(l.siteNom.toLowerCase().trim())!;
        await saveRow('locaux', {
          id: generateId(), siteId, nom: l.nom, type: l.type, surface: l.surface, etage: l.etage,
        });
      }
      alert(`Import terminé : ${newSites.length} site(s) et ${okLocaux.length} local(aux) ajoutés.`);
      navigate('/sites');
    } catch (e: any) {
      alert('Erreur import : ' + e.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/sites')} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft /></button>
        <h1 className="text-2xl font-bold">Importer un fichier Excel</h1>
      </div>

      <Card>
        <h2 className="text-lg font-semibold mb-2">1. Télécharger le modèle</h2>
        <p className="text-sm text-gray-500 mb-4">
          Le fichier contient 2 feuilles : <strong>Sites</strong> (1 ligne par site) et <strong>Locaux</strong> (référence le site par son nom).
        </p>
        <Button variant="secondary" onClick={downloadTemplateSites}>📥 Télécharger le modèle</Button>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold mb-2">2. Charger votre fichier rempli</h2>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
          className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
        />
      </Card>

      {preview && (
        <>
          {preview.errors.length > 0 && (
            <Card className="border-l-4 border-l-orange-500 bg-orange-50">
              <h3 className="font-semibold text-orange-900 mb-2">Avertissements</h3>
              <ul className="text-sm text-orange-800 list-disc pl-5">
                {preview.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </Card>
          )}

          <Card>
            <h2 className="text-lg font-semibold mb-3">Aperçu — Sites ({preview.sites.length})</h2>
            {preview.sites.length === 0 ? (
              <p className="text-sm text-gray-500">Aucun site dans le fichier.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-2">Nom</th>
                      <th className="text-left p-2">Client</th>
                      <th className="text-left p-2">Ville</th>
                      <th className="text-left p-2">Fréquence</th>
                      <th className="text-left p-2">Seuil</th>
                      <th className="text-left p-2">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.sites.map((s, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2 font-medium">{s.nom}</td>
                        <td className="p-2">{s.client || '-'}</td>
                        <td className="p-2">{s.ville || '-'}</td>
                        <td className="p-2">{s.frequenceControle}</td>
                        <td className="p-2">{s.seuilCible}%</td>
                        <td className="p-2">{s.isDuplicate ? <Badge variant="warning">Doublon (ignoré)</Badge> : <Badge variant="success">Nouveau</Badge>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {preview.locaux.length > 0 && (
            <Card>
              <h2 className="text-lg font-semibold mb-3">Aperçu — Locaux ({preview.locaux.length})</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-2">Site</th>
                      <th className="text-left p-2">Nom</th>
                      <th className="text-left p-2">Type</th>
                      <th className="text-left p-2">Surface</th>
                      <th className="text-left p-2">Étage</th>
                      <th className="text-left p-2">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.locaux.map((l, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2">{l.siteNom}</td>
                        <td className="p-2 font-medium">{l.nom}</td>
                        <td className="p-2">{l.type}</td>
                        <td className="p-2">{l.surface} m²</td>
                        <td className="p-2">{l.etage}</td>
                        <td className="p-2">{l.siteExists ? <Badge variant="success">OK</Badge> : <Badge variant="danger">Site inconnu</Badge>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setPreview(null)}>Annuler</Button>
            <Button onClick={doImport} disabled={importing}>{importing ? 'Import en cours...' : '✓ Lancer l\'import'}</Button>
          </div>
        </>
      )}
    </div>
  );
}

// --- Site Form (create + edit) ---
function SiteFormPage() {
  const { data, saveRow, isAdminOrManager } = useApp();
  const { id } = useParams();
  const navigate = useNavigate();
  const existing = id ? getSiteById(data.sites, id) : null;
  if (!isAdminOrManager) return <Card className="text-center py-8"><p className="text-gray-500">Vous n'avez pas les droits pour modifier les sites.</p></Card>;
  const [form, setForm] = useState<any>(existing || {
    id: generateId(),
    nom: '',
    adresse: '',
    ville: '',
    client: '',
    responsableSecteur: '',
    frequenceControle: 'Hebdomadaire',
    seuilCible: 90,
  });
  const [selectedTpl, setSelectedTpl] = useState('');
  const [busy, setBusy] = useState(false);

  const applyTemplate = (tplId: string) => {
    setSelectedTpl(tplId);
    if (!tplId) return;
    const tpl = data.templates.find((t: any) => t.id === tplId);
    if (!tpl) return;
    setForm((prev: any) => ({
      ...prev,
      frequenceControle: tpl.frequenceControle || prev.frequenceControle,
      seuilCible: tpl.seuilCible || prev.seuilCible,
    }));
  };

  const handleSave = async () => {
    if (!form.nom) { alert('Nom requis'); return; }
    setBusy(true);
    try {
      await saveRow('sites', form);
      // Si template sélectionné en création, créer locaux + agents
      if (selectedTpl && !existing) {
        const tpl = data.templates.find((t: any) => t.id === selectedTpl);
        if (tpl) {
          for (const l of (tpl.locaux || [])) {
            await saveRow('locaux', { id: generateId(), siteId: form.id, nom: l.nom, type: l.type, surface: l.surface, etage: l.etage });
          }
          for (const a of (tpl.agents || [])) {
            await saveRow('agents', { id: generateId(), siteId: form.id, nom: a.nom, prenom: a.prenom, email: a.email });
          }
        }
      }
      navigate(`/sites/${form.id}`);
    } catch (e: any) {
      alert('Erreur: ' + e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft /></button>
        <h1 className="text-2xl font-bold">{existing ? 'Modifier le site' : 'Nouveau site'}</h1>
      </div>
      {!existing && data.templates.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <h3 className="font-medium mb-2">🚀 Démarrer depuis un template</h3>
          <p className="text-sm text-gray-600 mb-3">Crée le site avec ses locaux et agents pré-remplis.</p>
          <Select
            label=""
            value={selectedTpl}
            onChange={(e: any) => applyTemplate(e.target.value)}
            options={[{ value: '', label: 'Aucun (création vierge)' }, ...data.templates.map((t: any) => ({ value: t.id, label: `${t.nom} (${(t.locaux || []).length} locaux, ${(t.agents || []).length} agents)` }))]}
          />
        </Card>
      )}

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Nom" value={form.nom} onChange={(e: any) => setForm({ ...form, nom: e.target.value })} required />
          <Input label="Client" value={form.client || ''} onChange={(e: any) => setForm({ ...form, client: e.target.value })} />
          <Input label="Adresse" value={form.adresse || ''} onChange={(e: any) => setForm({ ...form, adresse: e.target.value })} />
          <Input label="Ville" value={form.ville || ''} onChange={(e: any) => setForm({ ...form, ville: e.target.value })} />
          <Input label="Responsable secteur" value={form.responsableSecteur || ''} onChange={(e: any) => setForm({ ...form, responsableSecteur: e.target.value })} />
          <Select
            label="Fréquence"
            value={form.frequenceControle || 'Hebdomadaire'}
            onChange={(e: any) => setForm({ ...form, frequenceControle: e.target.value })}
            options={[
              { value: 'Hebdomadaire', label: 'Hebdomadaire' },
              { value: 'Mensuelle', label: 'Mensuelle' },
              { value: 'Trimestrielle', label: 'Trimestrielle' },
            ]}
          />
          <Input label="Seuil cible (%)" type="number" value={form.seuilCible || 90} onChange={(e: any) => setForm({ ...form, seuilCible: parseInt(e.target.value) || 0 })} />
          <Input label="Email client (rapports)" type="email" value={form.emailClient || ''} onChange={(e: any) => setForm({ ...form, emailClient: e.target.value })} placeholder="contact@client.fr" />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={() => navigate(-1)}>Annuler</Button>
          <Button onClick={handleSave} disabled={busy}>{busy ? '...' : 'Enregistrer'}</Button>
        </div>
      </Card>
    </div>
  );
}

// --- Site Detail ---
function SiteDetailPage() {
  const { data, saveRow, removeRow, ownsSite, isAdminOrManager } = useApp();
  const { id } = useParams();
  const navigate = useNavigate();
  const site = getSiteById(data.sites, id || '');
  const inOrg = site ? ownsSite(site.id) : false;
  const canEdit = inOrg && isAdminOrManager;

  const [newLocal, setNewLocal] = useState<any>({ nom: '', type: 'Bureau', surface: 0, etage: 'RDC' });
  const [newAgent, setNewAgent] = useState<any>({ nom: '', prenom: '', email: '' });
  const [newViewer, setNewViewer] = useState('');
  const [viewers, setViewers] = useState<any[]>([]);

  useEffect(() => {
    if (!site || !canEdit || isDemoMode()) return;
    supabase.from('site_viewers').select('*').eq('site_id', site.id).then(({ data }) => {
      if (data) setViewers(data);
    });
  }, [site, canEdit]);

  const addViewer = async () => {
    if (!newViewer.includes('@')) { alert('Email invalide'); return; }
    if (isDemoMode()) {
      setViewers([...viewers, { site_id: site!.id, email: newViewer.trim().toLowerCase() }]);
      setNewViewer('');
      return;
    }
    const { error } = await supabase.from('site_viewers').insert({ site_id: site!.id, email: newViewer.trim().toLowerCase() });
    if (error) { alert(error.message); return; }
    setViewers([...viewers, { site_id: site!.id, email: newViewer.trim().toLowerCase() }]);
    setNewViewer('');
  };
  const removeViewer = async (email: string) => {
    if (!isDemoMode()) await supabase.from('site_viewers').delete().eq('site_id', site!.id).eq('email', email);
    setViewers(viewers.filter(v => v.email !== email));
  };

  if (!site) {
    return (
      <Card className="text-center py-8">
        <p className="text-gray-500">Site non trouvé</p>
        <Button onClick={() => navigate('/sites')}>Retour</Button>
      </Card>
    );
  }

  const locaux = data.locaux.filter((l: any) => l.siteId === site.id);
  const controles = data.controles.filter((c: any) => c.siteId === site.id);
  const agents = data.agents.filter((a: any) => a.siteId === site.id);

  const handleAddLocal = async () => {
    if (!newLocal.nom) return;
    await saveRow('locaux', { ...newLocal, id: generateId(), siteId: site.id });
    setNewLocal({ nom: '', type: 'Bureau', surface: 0, etage: 'RDC' });
  };

  const handleAddAgent = async () => {
    if (!newAgent.nom) return;
    await saveRow('agents', { ...newAgent, id: generateId(), siteId: site.id });
    setNewAgent({ nom: '', prenom: '', email: '' });
  };

  const handleDeleteSite = async () => {
    if (!confirm(`Supprimer le site "${site.nom}" et tous ses contrôles/locaux ?`)) return;
    await removeRow('sites', site.id);
    navigate('/sites');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/sites')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronLeft />
          </button>
          <div>
            <h1 className="text-2xl font-bold">{site.nom}</h1>
            <p className="text-gray-500">{site.ville} - {site.client}</p>
          </div>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate(`/sites/${site.id}/edit`)}>Modifier</Button>
            <Button variant="outline" onClick={handleDeleteSite} className="text-red-600 border-red-300">Supprimer</Button>
          </div>
        )}
      </div>

      {canEdit && (
        <Card>
          <h2 className="text-lg font-semibold mb-2">Accès client en lecture</h2>
          <p className="text-sm text-gray-500 mb-4">
            Les emails listés pourront se connecter (avec un compte qu'ils créeront eux-mêmes) et consulter <strong>uniquement</strong> ce site et ses contrôles, sans rien modifier.
          </p>
          <div className="space-y-2 mb-4">
            {viewers.map(v => (
              <div key={v.email} className="p-2 bg-gray-50 rounded border border-gray-200 flex justify-between items-center">
                <span className="text-sm">{v.email}</span>
                <button onClick={() => removeViewer(v.email)} className="text-red-600 text-sm hover:underline px-3 py-2 -mx-3 -my-2 rounded hover:bg-red-50">Retirer</button>
              </div>
            ))}
            {viewers.length === 0 && <p className="text-sm text-gray-400">Aucun accès partagé</p>}
          </div>
          <div className="flex gap-2 items-end">
            <Input label="Email du client" type="email" value={newViewer} onChange={(e: any) => setNewViewer(e.target.value)} placeholder="client@entreprise.com" />
            <Button onClick={addViewer}>+ Ajouter</Button>
          </div>
        </Card>
      )}

      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Locaux ({locaux.length})</h2>
          {canEdit && data.templates.length > 0 && (
            <Select
              label=""
              value=""
              onChange={async (e: any) => {
                const tplId = e.target.value;
                if (!tplId) return;
                const tpl = data.templates.find((t: any) => t.id === tplId);
                if (!tpl) return;
                const nbAgents = (tpl.agents || []).length;
                if (!confirm(`Ajouter ${tpl.locaux.length} locaux${nbAgents ? ` et ${nbAgents} agent(s)` : ''} du template "${tpl.nom}" ?`)) return;
                for (const l of tpl.locaux) {
                  await saveRow('locaux', { id: generateId(), siteId: site.id, nom: l.nom, type: l.type, surface: l.surface, etage: l.etage });
                }
                for (const a of (tpl.agents || [])) {
                  await saveRow('agents', { id: generateId(), siteId: site.id, nom: a.nom, prenom: a.prenom, email: a.email });
                }
              }}
              options={[{ value: '', label: '+ Appliquer un template…' }, ...data.templates.map((t: any) => ({ value: t.id, label: `${t.nom} (${(t.locaux || []).length} locaux)` }))]}
            />
          )}
        </div>
        <div className="space-y-2 mb-4">
          {locaux.map((local: any) => (
            <div key={local.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex justify-between items-center">
              <div>
                <p className="font-medium">{local.nom}</p>
                <p className="text-sm text-gray-500">{local.type} - {local.surface}m² - {local.etage}</p>
              </div>
              {canEdit && <button onClick={() => removeRow('locaux', local.id)} className="text-red-600 text-sm hover:underline px-3 py-2 -mx-3 -my-2 rounded hover:bg-red-50">Suppr.</button>}
            </div>
          ))}
        </div>
        {canEdit && (<>
        <div className="border-t pt-4 grid grid-cols-2 md:grid-cols-5 gap-2">
          <Input label="Nom" value={newLocal.nom} onChange={(e: any) => setNewLocal({ ...newLocal, nom: e.target.value })} />
          <Select
            label="Type"
            value={newLocal.type}
            onChange={(e: any) => setNewLocal({ ...newLocal, type: e.target.value })}
            options={[
              { value: 'Bureau', label: 'Bureau' },
              { value: 'Sanitaire', label: 'Sanitaire' },
              { value: 'Circulation', label: 'Circulation' },
              { value: 'Vestiaire', label: 'Vestiaire' },
              { value: 'Cuisine/Office', label: 'Cuisine/Office' },
            ]}
          />
          <Input label="Surface (m²)" type="number" value={newLocal.surface} onChange={(e: any) => setNewLocal({ ...newLocal, surface: parseInt(e.target.value) || 0 })} />
          <Input label="Étage" value={newLocal.etage} onChange={(e: any) => setNewLocal({ ...newLocal, etage: e.target.value })} />
          <div className="flex items-end">
            <Button onClick={handleAddLocal} className="w-full">+ Ajouter</Button>
          </div>
        </div>
        </>)}
      </Card>

      {canEdit && (
        <Card>
          <h2 className="text-lg font-semibold mb-4">Agents ({agents.length})</h2>
          <div className="space-y-2 mb-4">
            {agents.map((a: any) => (
              <div key={a.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex justify-between items-center">
                <div>
                  <p className="font-medium">{a.prenom} {a.nom}</p>
                  {a.email && <p className="text-xs text-gray-500">{a.email}</p>}
                </div>
                <button onClick={() => removeRow('agents', a.id)} className="text-red-600 text-sm hover:underline px-3 py-2 -mx-3 -my-2 rounded hover:bg-red-50">Suppr.</button>
              </div>
            ))}
          </div>
          <div className="border-t pt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
            <Input label="Prénom" value={newAgent.prenom} onChange={(e: any) => setNewAgent({ ...newAgent, prenom: e.target.value })} />
            <Input label="Nom" value={newAgent.nom} onChange={(e: any) => setNewAgent({ ...newAgent, nom: e.target.value })} />
            <Input label="Email" type="email" value={newAgent.email} onChange={(e: any) => setNewAgent({ ...newAgent, email: e.target.value })} />
            <div className="flex items-end">
              <Button onClick={handleAddAgent} className="w-full">+ Ajouter</Button>
            </div>
          </div>
        </Card>
      )}

      {controles.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold mb-2">Rapport mensuel</h2>
          <p className="text-sm text-gray-500 mb-3">Synthèse PDF de tous les contrôles du mois pour ce site.</p>
          <RapportMensuelButton site={site} controles={controles} />
        </Card>
      )}

      {controles.filter((c: any) => c.tauxConformite !== null).length >= 2 && (
        <Card>
          <h2 className="text-lg font-semibold mb-4">Évolution du taux de conformité</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[...controles].filter((c: any) => c.tauxConformite !== null).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((c: any) => ({ date: new Date(c.date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }), taux: c.tauxConformite }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="taux" fill="#3B82F6" />
                <ReferenceLine y={site.seuilCible || 90} stroke="#EF4444" strokeDasharray="3 3" label="Seuil" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <Card>
        <h2 className="text-lg font-semibold mb-4">Contrôles ({controles.length})</h2>
        <div className="space-y-2">
          {controles.map((c: any) => (
            <Link key={c.id} to={`/controles/${c.id}`} className="block p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300">
              <p className="font-medium">{c.type} - {formatDate(c.date)}{c.tauxConformite !== null ? ` · ${c.tauxConformite}%` : ''}</p>
            </Link>
          ))}
        </div>
        {inOrg && (
          <Button className="w-full mt-4" onClick={() => navigate(`/controles/nouveau?siteId=${site.id}`)}>
            Nouveau contrôle
          </Button>
        )}
      </Card>
    </div>
  );
}

function RapportMensuelButton({ site, controles }: { site: any; controles: any[] }) {
  const { data } = useApp();
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const monthControles = controles.filter((c: any) => c.date.startsWith(month) && c.statut !== 'Planifié');
  const monthResultats = data.resultats.filter((r: any) => monthControles.some((c: any) => c.id === r.controleId));
  const monthActions = data.actions.filter((a: any) => monthControles.some((c: any) => c.id === a.controleId));

  return (
    <div className="flex gap-2 items-end flex-wrap">
      <Input label="Mois" type="month" value={month} onChange={(e: any) => setMonth(e.target.value)} />
      <Button
        disabled={monthControles.length === 0}
        onClick={() => exportRapportMensuelPdf({ site, month, controles: monthControles, resultats: monthResultats, actions: monthActions, agents: data.agents, criteres: data.criteres })}
      >
        Générer ({monthControles.length} contrôle{monthControles.length > 1 ? 's' : ''})
      </Button>
    </div>
  );
}

// --- Critères ---
function CriteresPage() {
  const { data, saveRow, removeRow, isAdminOrManager } = useApp();
  if (!isAdminOrManager) return <Card className="text-center py-8"><p className="text-gray-500">Vous n'avez pas les droits pour gérer les critères.</p></Card>;
  const [form, setForm] = useState<any>({ libelle: '', categorie: '', coefficient: 2, typeLocal: [] });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const TYPES = ['Bureau', 'Sanitaire', 'Circulation', 'Vestiaire', 'Cuisine/Office'];

  const importPack = async (packKey: string) => {
    const pack = PACKS[packKey];
    if (!pack) return;
    if (!confirm(`Importer ${pack.criteres.length} critères du "${pack.label}" ?\n\nLes critères en double (même libellé) ne seront pas ajoutés.`)) return;
    setImporting(true);
    try {
      const existing = new Set(data.criteres.map((c: any) => c.libelle.toLowerCase().trim()));
      const toAdd = pack.criteres.filter(c => !existing.has(c.libelle.toLowerCase().trim()));
      for (const c of toAdd) {
        await saveRow('criteres', { ...c, id: generateId() });
      }
      alert(`${toAdd.length} critères importés (${pack.criteres.length - toAdd.length} doublons ignorés)`);
    } catch (e: any) {
      alert('Erreur: ' + (e?.message || e));
    } finally {
      setImporting(false);
    }
  };

  const handleSave = async () => {
    if (!form.libelle) { alert('Libellé requis'); return; }
    const row = editingId ? { ...form, id: editingId } : { ...form, id: generateId() };
    await saveRow('criteres', row);
    setForm({ libelle: '', categorie: '', coefficient: 2, typeLocal: [] });
    setEditingId(null);
  };

  const handleEdit = (c: any) => {
    setForm({ libelle: c.libelle, categorie: c.categorie, coefficient: c.coefficient, typeLocal: c.typeLocal || [] });
    setEditingId(c.id);
  };

  const toggleType = (t: string) => {
    setForm((f: any) => ({
      ...f,
      typeLocal: f.typeLocal.includes(t) ? f.typeLocal.filter((x: string) => x !== t) : [...f.typeLocal, t],
    }));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Critères de contrôle</h1>

      <Card>
        <h2 className="text-lg font-semibold mb-2">Bibliothèque standard</h2>
        <div className="space-y-3">
          {Object.entries(PACKS).map(([key, pack]) => (
            <div key={key} className="flex items-center justify-between gap-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div>
                <p className="font-medium">{pack.label}</p>
                <p className="text-sm text-gray-600">{pack.description}</p>
              </div>
              <Button onClick={() => importPack(key)} disabled={importing}>
                {importing ? '...' : 'Importer'}
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold mb-4">{editingId ? 'Modifier' : 'Nouveau critère'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Libellé" value={form.libelle} onChange={(e: any) => setForm({ ...form, libelle: e.target.value })} required />
          <Input label="Catégorie" value={form.categorie} onChange={(e: any) => setForm({ ...form, categorie: e.target.value })} />
          <Select
            label="Coefficient"
            value={String(form.coefficient)}
            onChange={(e: any) => setForm({ ...form, coefficient: parseInt(e.target.value) })}
            options={[{ value: '1', label: '1 (faible)' }, { value: '2', label: '2 (moyen)' }, { value: '3', label: '3 (fort)' }]}
          />
        </div>
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">S'applique aux locaux :</p>
          <div className="flex flex-wrap gap-2">
            {TYPES.map(t => (
              <button
                key={t}
                onClick={() => toggleType(t)}
                className={`px-3 py-1 text-sm rounded-full border ${form.typeLocal.includes(t) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}
              >{t}</button>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          {editingId && <Button variant="secondary" onClick={() => { setEditingId(null); setForm({ libelle: '', categorie: '', coefficient: 2, typeLocal: [] }); }}>Annuler</Button>}
          <Button onClick={handleSave}>{editingId ? 'Mettre à jour' : '+ Ajouter'}</Button>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold mb-4">Liste ({data.criteres.length})</h2>
        <div className="space-y-2">
          {data.criteres.map((c: any) => (
            <div key={c.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex justify-between items-center">
              <div className="flex-1">
                <p className="font-medium">{c.libelle}</p>
                <p className="text-xs text-gray-500">{c.categorie} · coef {c.coefficient} · {(c.typeLocal || []).join(', ')}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(c)} className="text-blue-600 text-sm hover:underline px-3 py-2 -mx-3 -my-2 rounded hover:bg-blue-50">Modifier</button>
                <button onClick={() => removeRow('criteres', c.id)} className="text-red-600 text-sm hover:underline px-3 py-2 -mx-3 -my-2 rounded hover:bg-red-50">Suppr.</button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// --- Commentaires types ---
function CommentairesTypesPage() {
  const { data, saveRow, removeRow, isAdminOrManager } = useApp();
  const [form, setForm] = useState<any>({ libelle: '', note: '', categorie: '' });
  const [editingId, setEditingId] = useState<string | null>(null);

  if (!isAdminOrManager) return <Card className="text-center py-8"><p>Accès réservé.</p></Card>;

  const reset = () => { setForm({ libelle: '', note: '', categorie: '' }); setEditingId(null); };

  const save = async () => {
    if (!form.libelle.trim()) { alert('Libellé requis'); return; }
    await saveRow('commentaires_types', {
      id: editingId || generateId(),
      libelle: form.libelle.trim(),
      note: form.note || null,
      categorie: form.categorie || null,
    });
    reset();
  };

  const edit = (c: any) => { setForm({ libelle: c.libelle, note: c.note || '', categorie: c.categorie || '' }); setEditingId(c.id); };

  const byNote = (n: string) => data.commentairesTypes.filter((c: any) => (n === '' ? !c.note : c.note === n));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Commentaires types</h1>
      <p className="text-sm text-gray-500">
        Modèles de commentaires réutilisables lors de la saisie d'un contrôle. Vos contrôleurs cliqueront dessus au lieu de tout retaper.
      </p>

      <Card>
        <h2 className="text-lg font-semibold mb-4">{editingId ? 'Modifier' : 'Nouveau modèle'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <Input label="Libellé" value={form.libelle} onChange={(e: any) => setForm({ ...form, libelle: e.target.value })} placeholder="ex: Trace de pas humide" required />
          <Select
            label="Apparaît pour la note"
            value={form.note}
            onChange={(e: any) => setForm({ ...form, note: e.target.value })}
            options={[
              { value: '', label: 'Toutes les notes' },
              { value: 'Conforme', label: 'Conforme' },
              { value: 'Partiellement conforme', label: 'Partiellement conforme' },
              { value: 'Non conforme', label: 'Non conforme' },
              { value: 'Non applicable', label: 'Non applicable' },
            ]}
          />
          <Input label="Catégorie (optionnel)" value={form.categorie} onChange={(e: any) => setForm({ ...form, categorie: e.target.value })} placeholder="ex: Sols, Sanitaires" />
          <div className="flex gap-2">
            {editingId && <Button variant="secondary" onClick={reset}>Annuler</Button>}
            <Button onClick={save} className="flex-1">{editingId ? 'Mettre à jour' : '+ Ajouter'}</Button>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {['Conforme', 'Partiellement conforme', 'Non conforme', 'Non applicable', ''].map((n) => {
          const items = byNote(n);
          if (items.length === 0) return null;
          return (
            <Card key={n || 'all'}>
              <h3 className="font-semibold mb-3">
                {n || 'Universels (toutes notes)'}
                <span className="text-sm text-gray-500 ml-2">({items.length})</span>
              </h3>
              <div className="space-y-2">
                {items.map((c: any) => (
                  <div key={c.id} className="p-2 bg-gray-50 rounded border border-gray-200 flex justify-between items-center">
                    <div>
                      <p className="text-sm">{c.libelle}</p>
                      {c.categorie && <p className="text-xs text-gray-500">{c.categorie}</p>}
                    </div>
                    <div className="flex gap-2 text-sm">
                      <button onClick={() => edit(c)} className="text-blue-600 hover:underline">Modifier</button>
                      <button onClick={() => confirm('Supprimer ?') && removeRow('commentaires_types', c.id)} className="text-red-600 hover:underline">Suppr.</button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
        {data.commentairesTypes.length === 0 && (
          <Card className="text-center py-8">
            <p className="text-gray-500">Aucun modèle. Créez-en pour faire gagner du temps à vos contrôleurs.</p>
          </Card>
        )}
      </div>
    </div>
  );
}

// --- Templates ---
const TYPES_LOCAUX = ['Bureau', 'Sanitaire', 'Circulation', 'Vestiaire', 'Cuisine/Office'];

function TemplatesPage() {
  const { data, saveRow, removeRow, isAdminOrManager } = useApp();
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>({ nom: '', description: '', locaux: [] });

  if (!isAdminOrManager) return <Card className="text-center py-8"><p>Accès réservé.</p></Card>;

  const blank = { nom: '', description: '', locaux: [], agents: [], frequenceControle: 'Hebdomadaire', seuilCible: 90 };
  const openNew = () => { setForm(blank); setEditing({}); };
  const openEdit = (t: any) => { setForm({ nom: t.nom, description: t.description || '', locaux: t.locaux || [], agents: t.agents || [], frequenceControle: t.frequenceControle || 'Hebdomadaire', seuilCible: t.seuilCible || 90 }); setEditing(t); };
  const close = () => { setEditing(null); setForm(blank); };

  const save = async () => {
    if (!form.nom.trim()) { alert('Nom requis'); return; }
    await saveRow('templates', {
      id: editing?.id || generateId(),
      nom: form.nom,
      description: form.description,
      locaux: form.locaux,
      agents: form.agents,
      frequenceControle: form.frequenceControle,
      seuilCible: form.seuilCible,
    });
    close();
  };

  const addLocal = () => setForm({ ...form, locaux: [...form.locaux, { nom: '', type: 'Bureau', surface: 0, etage: 'RDC' }] });
  const updateLocal = (i: number, patch: any) => setForm({ ...form, locaux: form.locaux.map((l: any, idx: number) => idx === i ? { ...l, ...patch } : l) });
  const removeLocal = (i: number) => setForm({ ...form, locaux: form.locaux.filter((_: any, idx: number) => idx !== i) });

  const addAgent = () => setForm({ ...form, agents: [...form.agents, { prenom: '', nom: '', email: '' }] });
  const updateAgent = (i: number, patch: any) => setForm({ ...form, agents: form.agents.map((a: any, idx: number) => idx === i ? { ...a, ...patch } : a) });
  const removeAgent = (i: number) => setForm({ ...form, agents: form.agents.filter((_: any, idx: number) => idx !== i) });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Templates de site</h1>
          <p className="text-sm text-gray-500">Modèles de locaux à appliquer en 1 clic sur un nouveau site.</p>
        </div>
        <Button onClick={openNew}>+ Nouveau template</Button>
      </div>

      <div className="space-y-3">
        {data.templates.length === 0 ? (
          <Card className="text-center py-8"><p className="text-gray-500">Aucun template. Crée le premier.</p></Card>
        ) : data.templates.map((t: any) => (
          <Card key={t.id}>
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <h3 className="font-semibold">{t.nom}</h3>
                {t.description && <p className="text-sm text-gray-500">{t.description}</p>}
                <p className="text-xs text-gray-400 mt-1">
                  {(t.locaux || []).length} local(aux) · {(t.agents || []).length} agent(s) · {t.frequenceControle || 'Hebdo'} · seuil {t.seuilCible || 90}%
                </p>
              </div>
              <div className="flex gap-2 text-sm">
                <button onClick={() => openEdit(t)} className="text-blue-600 hover:underline">Modifier</button>
                <button onClick={() => confirm(`Supprimer "${t.nom}" ?`) && removeRow('templates', t.id)} className="text-red-600 hover:underline">Suppr.</button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {editing !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-auto">
          <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">{editing.id ? 'Modifier' : 'Nouveau'} template</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <Input label="Nom" value={form.nom} onChange={(e: any) => setForm({ ...form, nom: e.target.value })} required />
              <Input label="Description" value={form.description} onChange={(e: any) => setForm({ ...form, description: e.target.value })} placeholder="ex: Immeuble bureaux standard" />
              <Select
                label="Fréquence de contrôle par défaut"
                value={form.frequenceControle}
                onChange={(e: any) => setForm({ ...form, frequenceControle: e.target.value })}
                options={[{ value: 'Hebdomadaire', label: 'Hebdomadaire' }, { value: 'Mensuelle', label: 'Mensuelle' }, { value: 'Trimestrielle', label: 'Trimestrielle' }]}
              />
              <Input label="Seuil cible (%)" type="number" value={form.seuilCible} onChange={(e: any) => setForm({ ...form, seuilCible: parseInt(e.target.value) || 90 })} />
            </div>

            <h3 className="font-medium mb-2">Locaux ({form.locaux.length})</h3>
            <div className="space-y-2 mb-2">
              {form.locaux.map((l: any, i: number) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end p-2 bg-gray-50 rounded">
                  <Input label="Nom" value={l.nom} onChange={(e: any) => updateLocal(i, { nom: e.target.value })} />
                  <Select label="Type" value={l.type} onChange={(e: any) => updateLocal(i, { type: e.target.value })} options={TYPES_LOCAUX.map(t => ({ value: t, label: t }))} />
                  <Input label="Surface" type="number" value={l.surface} onChange={(e: any) => updateLocal(i, { surface: parseInt(e.target.value) || 0 })} />
                  <Input label="Étage" value={l.etage} onChange={(e: any) => updateLocal(i, { etage: e.target.value })} />
                  <button onClick={() => removeLocal(i)} className="text-red-600 text-sm hover:underline px-3 py-2 -mx-3 -my-2 rounded hover:bg-red-50">Supprimer</button>
                </div>
              ))}
            </div>
            <Button variant="secondary" onClick={addLocal}>+ Ajouter un local</Button>

            <h3 className="font-medium mb-2 mt-6">Agents ({form.agents.length})</h3>
            <p className="text-xs text-gray-500 mb-2">Agents pré-créés sur le site lorsque le template est appliqué (utile pour onboarding rapide).</p>
            <div className="space-y-2 mb-2">
              {form.agents.map((a: any, i: number) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end p-2 bg-gray-50 rounded">
                  <Input label="Prénom" value={a.prenom} onChange={(e: any) => updateAgent(i, { prenom: e.target.value })} />
                  <Input label="Nom" value={a.nom} onChange={(e: any) => updateAgent(i, { nom: e.target.value })} />
                  <Input label="Email" type="email" value={a.email || ''} onChange={(e: any) => updateAgent(i, { email: e.target.value })} />
                  <button onClick={() => removeAgent(i)} className="text-red-600 text-sm hover:underline px-3 py-2 -mx-3 -my-2 rounded hover:bg-red-50">Supprimer</button>
                </div>
              ))}
            </div>
            <Button variant="secondary" onClick={addAgent}>+ Ajouter un agent</Button>
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
              <Button variant="secondary" onClick={close}>Annuler</Button>
              <Button onClick={save}>Enregistrer</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// --- Organisation ---
function OrganisationPage() {
  const { role, orgId } = useApp();
  const [org, setOrg] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [emailToInvite, setEmailToInvite] = useState('');
  const [roleToInvite, setRoleToInvite] = useState('controleur');
  const [orgName, setOrgName] = useState('');

  const reload = async () => {
    if (!orgId) return;
    if (isDemoMode()) {
      setOrg({ id: 'demo', name: 'Démo Propreté SARL' });
      setOrgName('Démo Propreté SARL');
      setMembers([
        { user_id: 'demo-admin', role: 'admin', email: 'demo@local' },
        { user_id: 'demo-manager', role: 'manager', email: 'manager@demo.fr' },
        { user_id: 'demo-controleur-1', role: 'controleur', email: 'jean.dupont@demo.fr' },
        { user_id: 'demo-controleur-2', role: 'controleur', email: 'marie.martin@demo.fr' },
      ]);
      setInvitations([
        { email: 'pierre.bernard@demo.fr', role: 'controleur' },
      ]);
      return;
    }
    const [oRes, mRes, iRes] = await Promise.all([
      supabase.from('organizations').select('*').eq('id', orgId).maybeSingle(),
      supabase.from('org_members').select('*'),
      supabase.from('org_invitations').select('*'),
    ]);
    setOrg(oRes.data);
    setOrgName(oRes.data?.name || '');
    setMembers(mRes.data || []);
    setInvitations(iRes.data || []);
  };

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [orgId]);

  if (!orgId) return <Card><p>Pas d'organisation associée.</p></Card>;
  const isAdmin = role === 'admin';

  const invite = async () => {
    if (!emailToInvite.includes('@')) { alert('Email invalide'); return; }
    if (isDemoMode()) {
      setInvitations([...invitations, { email: emailToInvite.trim().toLowerCase(), role: roleToInvite }]);
      setEmailToInvite('');
      return;
    }
    const { error } = await supabase.from('org_invitations').insert({
      org_id: orgId, email: emailToInvite.trim().toLowerCase(), role: roleToInvite,
    });
    if (error) { alert(error.message); return; }
    setEmailToInvite('');
    reload();
  };

  const removeMember = async (uid: string) => {
    if (!confirm('Retirer ce membre ?')) return;
    if (isDemoMode()) { setMembers(members.filter(m => m.user_id !== uid)); return; }
    await supabase.from('org_members').delete().eq('user_id', uid).eq('org_id', orgId);
    reload();
  };
  const changeRole = async (uid: string, newRole: string) => {
    if (isDemoMode()) { setMembers(members.map(m => m.user_id === uid ? { ...m, role: newRole } : m)); return; }
    await supabase.from('org_members').update({ role: newRole }).eq('user_id', uid).eq('org_id', orgId);
    reload();
  };
  const renameOrg = async () => {
    if (!orgName.trim()) return;
    if (isDemoMode()) { setOrg({ ...org, name: orgName }); return; }
    await supabase.from('organizations').update({ name: orgName }).eq('id', orgId);
    reload();
  };
  const cancelInvite = async (email: string) => {
    if (isDemoMode()) { setInvitations(invitations.filter(i => i.email !== email)); return; }
    await supabase.from('org_invitations').delete().eq('org_id', orgId).eq('email', email);
    reload();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mon organisation</h1>

      <Card>
        <h2 className="text-lg font-semibold mb-4">Informations</h2>
        <div className="flex gap-2 items-end">
          <Input label="Nom de l'organisation" value={orgName} onChange={(e: any) => setOrgName(e.target.value)} disabled={!isAdmin} />
          {isAdmin && <Button onClick={renameOrg} disabled={!orgName.trim() || orgName === org?.name}>Renommer</Button>}
        </div>
        <p className="text-xs text-gray-500 mt-2">Mon rôle : <strong>{role}</strong></p>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold mb-4">Membres ({members.length})</h2>
        <div className="space-y-2">
          {members.map((m: any) => (
            <div key={m.user_id} className="p-3 bg-gray-50 rounded border border-gray-200 flex justify-between items-center flex-wrap gap-2">
              <p className="font-mono text-xs">{m.user_id}</p>
              <div className="flex gap-2 items-center">
                {isAdmin ? (
                  <select value={m.role} onChange={e => changeRole(m.user_id, e.target.value)} className="px-2 py-1 border rounded text-sm">
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="controleur">Contrôleur</option>
                  </select>
                ) : <Badge variant="info">{m.role}</Badge>}
                {isAdmin && <button onClick={() => removeMember(m.user_id)} className="text-red-600 text-sm hover:underline px-3 py-2 -mx-3 -my-2 rounded hover:bg-red-50">Retirer</button>}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {isAdmin && (
        <Card>
          <h2 className="text-lg font-semibold mb-2">Inviter un membre</h2>
          <p className="text-sm text-gray-500 mb-4">
            L'invité crée un compte Supabase avec son email — à sa première connexion il rejoint automatiquement votre organisation.
          </p>
          <div className="flex gap-2 items-end flex-wrap">
            <Input label="Email" type="email" value={emailToInvite} onChange={(e: any) => setEmailToInvite(e.target.value)} placeholder="collegue@entreprise.com" />
            <Select
              label="Rôle"
              value={roleToInvite}
              onChange={(e: any) => setRoleToInvite(e.target.value)}
              options={[{ value: 'admin', label: 'Admin' }, { value: 'manager', label: 'Manager' }, { value: 'controleur', label: 'Contrôleur' }]}
            />
            <Button onClick={invite}>+ Inviter</Button>
          </div>
          {invitations.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Invitations en attente</h3>
              <div className="space-y-1">
                {invitations.map((i: any) => (
                  <div key={i.email} className="text-sm flex justify-between p-2 bg-yellow-50 rounded">
                    <span>{i.email} · {i.role}</span>
                    <button onClick={() => cancelInvite(i.email)} className="text-red-600 hover:underline">Annuler</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      <Card>
        <h2 className="text-lg font-semibold mb-2">Rôles</h2>
        <ul className="text-sm text-gray-600 space-y-1">
          <li><strong>Admin</strong> — gère l'organisation, invite/retire des membres, change les rôles. Accès complet.</li>
          <li><strong>Manager</strong> — valide les contrôles soumis pour approbation. Accès complet sauf gestion d'organisation.</li>
          <li><strong>Contrôleur</strong> — crée et saisit les contrôles. Soumet pour validation au manager.</li>
        </ul>
      </Card>
    </div>
  );
}

// --- Analytique ---
function AnalytiquePage() {
  const { data } = useApp();
  const [period, setPeriod] = useState<3 | 6 | 12>(6);

  const heatmap = heatmapData(data.sites, data.controles, period);
  const topKo = topCriteresEnEchec(data.resultats, data.criteres, 10);
  const ranking = rankingAgents(data.controles, data.agents, period);
  const declin = sitesEnDeclin(data.sites, data.controles);

  const taux3 = (siteId: string) => tauxMoyenPeriode(data.controles.filter((c: any) => c.siteId === siteId), 3);
  const taux12 = (siteId: string) => tauxMoyenPeriode(data.controles.filter((c: any) => c.siteId === siteId), 12);

  const colorTaux = (v: number | null) => {
    if (v === null) return 'bg-gray-100 text-gray-400';
    if (v >= 90) return 'bg-green-100 text-green-800';
    if (v >= 75) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Analytique</h1>
        <div className="flex gap-2">
          {[3, 6, 12].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p as any)}
              className={`px-3 py-1.5 rounded-lg text-sm border ${period === p ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}
            >{p} mois</button>
          ))}
        </div>
      </div>

      {declin.length > 0 && (
        <Card className="border-l-4 border-l-orange-500 bg-orange-50">
          <h2 className="text-lg font-semibold text-orange-900 mb-3">⚠️ Sites en déclin ({declin.length})</h2>
          <div className="space-y-1 text-sm">
            {declin.map(d => (
              <p key={d.site.id}><strong>{d.site.nom}</strong> — baisse de {Math.abs(d.delta)} pts sur 3 mois</p>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <h2 className="text-lg font-semibold mb-4">Vue comparative — Heatmap mensuelle</h2>
        {data.sites.length === 0 ? (
          <p className="text-sm text-gray-500">Aucun site.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left p-2">Site</th>
                  {heatmap.months.map(m => <th key={m} className="p-2 text-center text-xs">{m.slice(5)}/{m.slice(2, 4)}</th>)}
                  <th className="p-2 text-center text-xs">3 mois</th>
                  <th className="p-2 text-center text-xs">12 mois</th>
                </tr>
              </thead>
              <tbody>
                {heatmap.rows.map(row => (
                  <tr key={row.site.id} className="border-t">
                    <td className="p-2 font-medium">{row.site.nom}</td>
                    {heatmap.months.map(m => (
                      <td key={m} className="p-1 text-center">
                        <span className={`inline-block w-full px-2 py-1 rounded font-medium ${colorTaux(row[m])}`}>
                          {row[m] !== null ? `${row[m]}%` : '-'}
                        </span>
                      </td>
                    ))}
                    <td className="p-1 text-center"><span className={`inline-block w-full px-2 py-1 rounded font-medium ${colorTaux(taux3(row.site.id) || null)}`}>{taux3(row.site.id) || '-'}{taux3(row.site.id) ? '%' : ''}</span></td>
                    <td className="p-1 text-center"><span className={`inline-block w-full px-2 py-1 rounded font-medium ${colorTaux(taux12(row.site.id) || null)}`}>{taux12(row.site.id) || '-'}{taux12(row.site.id) ? '%' : ''}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold mb-4">Top critères en échec</h2>
          {topKo.length === 0 ? (
            <p className="text-sm text-gray-500">Pas assez de données.</p>
          ) : (
            <div className="space-y-2">
              {topKo.map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-500 w-5">#{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{c.libelle}</p>
                    <p className="text-xs text-gray-500">{c.categorie} · {c.ko} échecs / {c.total} évaluations</p>
                  </div>
                  <span className={`px-2 py-1 rounded font-bold text-sm ${colorTaux(100 - c.tauxEchec)}`}>{c.tauxEchec}%</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold mb-4">Ranking agents ({period} mois)</h2>
          {ranking.length === 0 ? (
            <p className="text-sm text-gray-500">Pas de données sur la période.</p>
          ) : (
            <div className="space-y-2">
              {ranking.map((r, i) => (
                <div key={r.agent.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                  <span className="text-xs font-bold text-gray-500 w-5">#{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{r.agent.prenom} {r.agent.nom}</p>
                    <p className="text-xs text-gray-500">{r.nbControles} contrôle{r.nbControles > 1 ? 's' : ''}</p>
                  </div>
                  <span className={`px-2 py-1 rounded font-bold text-sm ${colorTaux(r.tauxMoyen)}`}>{r.tauxMoyen}%</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// --- Planning ---
function PlanningPage() {
  const { data, saveRow, removeRow } = useApp();
  const navigate = useNavigate();
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [form, setForm] = useState<any>({ siteId: '', datePrevue: '', type: 'Programmé' });
  const [recForm, setRecForm] = useState<any>({ siteId: '', dateDebut: '', type: 'Programmé', frequence: 'weekly', occurrences: 12 });
  const [recBusy, setRecBusy] = useState(false);

  const monthStart = new Date(cursor);
  const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
  const startDay = (monthStart.getDay() + 6) % 7; // lundi = 0
  const daysInMonth = monthEnd.getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));

  const plannedByDate = new Map<string, any[]>();
  data.controles.filter((c: any) => c.statut === 'Planifié' && c.datePrevue).forEach((c: any) => {
    const k = c.datePrevue;
    if (!plannedByDate.has(k)) plannedByDate.set(k, []);
    plannedByDate.get(k)!.push(c);
  });

  const upcoming = data.controles
    .filter((c: any) => c.statut === 'Planifié' && c.datePrevue)
    .sort((a: any, b: any) => a.datePrevue.localeCompare(b.datePrevue));

  const handleAdd = async () => {
    if (!form.siteId || !form.datePrevue) { alert('Site et date requis'); return; }
    await saveRow('controles', {
      id: generateId(),
      siteId: form.siteId,
      date: form.datePrevue,
      datePrevue: form.datePrevue,
      type: form.type,
      statut: 'Planifié',
      controleurId: '',
      agentEvalueId: '',
      tauxConformite: null,
      commentaireGeneral: '',
    });
    setForm({ siteId: '', datePrevue: '', type: 'Programmé' });
  };

  const generateRecurrence = () => {
    if (!recForm.siteId || !recForm.dateDebut) return [];
    const dates: string[] = [];
    const start = new Date(recForm.dateDebut);
    const n = Math.min(Number(recForm.occurrences) || 0, 52);
    for (let i = 0; i < n; i++) {
      const d = new Date(start);
      if (recForm.frequence === 'weekly') d.setDate(d.getDate() + 7 * i);
      else if (recForm.frequence === 'biweekly') d.setDate(d.getDate() + 14 * i);
      else if (recForm.frequence === 'monthly') d.setMonth(d.getMonth() + i);
      else if (recForm.frequence === 'quarterly') d.setMonth(d.getMonth() + 3 * i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  };

  const handleAddRecurrence = async () => {
    const dates = generateRecurrence();
    if (dates.length === 0) { alert('Site et date de début requis'); return; }
    if (!confirm(`Créer ${dates.length} contrôles planifiés ?\n\nDu ${dates[0]} au ${dates[dates.length - 1]}`)) return;
    setRecBusy(true);
    try {
      for (const d of dates) {
        await saveRow('controles', {
          id: generateId(),
          siteId: recForm.siteId,
          date: d,
          datePrevue: d,
          type: recForm.type,
          statut: 'Planifié',
          controleurId: '',
          agentEvalueId: '',
          tauxConformite: null,
          commentaireGeneral: '',
        });
      }
      setRecForm({ siteId: '', dateDebut: '', type: 'Programmé', frequence: 'weekly', occurrences: 12 });
      alert(`${dates.length} contrôles planifiés créés.`);
    } catch (e: any) {
      alert('Erreur : ' + (e?.message || e));
    } finally {
      setRecBusy(false);
    }
  };

  const recPreview = generateRecurrence();

  const startControle = (c: any) => {
    navigate(`/controles/nouveau?siteId=${c.siteId}&planifieId=${c.id}`);
  };

  const monthLabel = cursor.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Planning des contrôles</h1>

      <Card>
        <h2 className="text-lg font-semibold mb-4">Planifier un contrôle ponctuel</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <Select
            label="Site"
            value={form.siteId}
            onChange={(e: any) => setForm({ ...form, siteId: e.target.value })}
            options={data.sites.map((s: any) => ({ value: s.id, label: s.nom }))}
          />
          <Input label="Date prévue" type="date" value={form.datePrevue} onChange={(e: any) => setForm({ ...form, datePrevue: e.target.value })} />
          <Select
            label="Type"
            value={form.type}
            onChange={(e: any) => setForm({ ...form, type: e.target.value })}
            options={[{ value: 'Programmé', label: 'Programmé' }, { value: 'Inopiné', label: 'Inopiné' }, { value: 'Contradictoire client', label: 'Contradictoire client' }]}
          />
          <Button onClick={handleAdd}>+ Planifier</Button>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold mb-2">Planification récurrente</h2>
        <p className="text-sm text-gray-500 mb-4">Génère plusieurs contrôles planifiés d'un coup selon une fréquence.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Select
            label="Site"
            value={recForm.siteId}
            onChange={(e: any) => setRecForm({ ...recForm, siteId: e.target.value })}
            options={data.sites.map((s: any) => ({ value: s.id, label: s.nom }))}
          />
          <Input label="Date du 1er contrôle" type="date" value={recForm.dateDebut} onChange={(e: any) => setRecForm({ ...recForm, dateDebut: e.target.value })} />
          <Select
            label="Type"
            value={recForm.type}
            onChange={(e: any) => setRecForm({ ...recForm, type: e.target.value })}
            options={[{ value: 'Programmé', label: 'Programmé' }, { value: 'Inopiné', label: 'Inopiné' }, { value: 'Contradictoire client', label: 'Contradictoire client' }]}
          />
          <Select
            label="Fréquence"
            value={recForm.frequence}
            onChange={(e: any) => setRecForm({ ...recForm, frequence: e.target.value })}
            options={[
              { value: 'weekly', label: 'Toutes les semaines' },
              { value: 'biweekly', label: 'Toutes les 2 semaines' },
              { value: 'monthly', label: 'Tous les mois' },
              { value: 'quarterly', label: 'Tous les trimestres' },
            ]}
          />
          <Input
            label="Nombre de contrôles (max 52)"
            type="number"
            value={recForm.occurrences}
            onChange={(e: any) => setRecForm({ ...recForm, occurrences: Math.min(52, Math.max(1, parseInt(e.target.value) || 1)) })}
          />
          <div className="flex items-end">
            <Button onClick={handleAddRecurrence} disabled={recBusy || !recForm.siteId || !recForm.dateDebut} className="w-full">
              {recBusy ? '...' : `+ Créer ${recPreview.length || ''} contrôles`}
            </Button>
          </div>
        </div>
        {recPreview.length > 0 && (
          <p className="text-xs text-gray-500 mt-3">
            Aperçu : du <strong>{recPreview[0]}</strong> au <strong>{recPreview[recPreview.length - 1]}</strong>
          </p>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="p-2 hover:bg-gray-100 rounded"><ChevronLeft /></button>
          <h2 className="text-lg font-semibold capitalize">{monthLabel}</h2>
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="p-2 hover:bg-gray-100 rounded">→</button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-xs text-gray-500 mb-1">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => <div key={d} className="text-center font-medium py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <div key={i} />;
            const key = d.toISOString().split('T')[0];
            const items = plannedByDate.get(key) || [];
            const isToday = key === today;
            const isPast = key < today;
            return (
              <div key={i} className={`min-h-20 border rounded p-1 ${isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} ${isPast && items.length ? 'bg-red-50' : ''}`}>
                <p className="text-xs text-gray-500">{d.getDate()}</p>
                {items.map(c => {
                  const site = getSiteById(data.sites, c.siteId);
                  return (
                    <button
                      key={c.id}
                      onClick={() => startControle(c)}
                      className="block w-full text-left mt-1 px-1 py-0.5 bg-blue-600 text-white text-xs rounded truncate hover:bg-blue-700"
                      title={`${site?.nom} - ${c.type}`}
                    >
                      {site?.nom}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold mb-4">À venir ({upcoming.length})</h2>
        <div className="space-y-2">
          {upcoming.map((c: any) => {
            const site = getSiteById(data.sites, c.siteId);
            const isPast = c.datePrevue < today;
            return (
              <div key={c.id} className={`p-3 rounded-lg border flex justify-between items-center ${isPast ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
                <div>
                  <p className="font-medium">{site?.nom} · {c.type}</p>
                  <p className="text-sm text-gray-500">
                    {formatDate(c.datePrevue)} {isPast && <span className="text-red-600 font-medium">(en retard)</span>}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => startControle(c)}>Démarrer</Button>
                  <button onClick={() => confirm('Annuler ce contrôle planifié ?') && removeRow('controles', c.id)} className="text-red-600 text-sm hover:underline px-3 py-2 -mx-3 -my-2 rounded hover:bg-red-50">Annuler</button>
                </div>
              </div>
            );
          })}
          {upcoming.length === 0 && <p className="text-gray-500 text-center py-4">Aucun contrôle planifié</p>}
        </div>
      </Card>
    </div>
  );
}

// --- Page publique (sans auth) ---
function PublicReportPage() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    supabase.rpc('get_public_controle', { t: token }).then(({ data, error }) => {
      if (error) setError(error.message);
      else if (!data) setError('Ce lien est invalide ou expiré.');
      else setPayload(data);
      setLoading(false);
    });
  }, [token]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Chargement...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center p-4"><Card className="text-center max-w-md"><AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" /><p>{error}</p></Card></div>;

  const controle = fromSnake(payload.controle);
  const site = fromSnake(payload.site);
  const resultats = (payload.resultats || []).map(fromSnake);
  const actions = (payload.actions || []).map(fromSnake);
  const criteres = (payload.criteres || []).map(fromSnake);
  const locaux = (payload.locaux || []).map(fromSnake);
  const agents = (payload.agents || []).map(fromSnake);
  const agent = agents.find((a: any) => a.id === controle.agentEvalueId);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-2">
          <Building2 className="w-6 h-6 text-blue-600" />
          <span className="font-semibold">Rapport de contrôle qualité</span>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-wrap items-center gap-4 justify-between">
          <div>
            <h1 className="text-2xl font-bold">{site?.nom}</h1>
            <p className="text-gray-500">{formatDate(controle.date)} · {controle.type}</p>
          </div>
          <Button onClick={() => exportControlePdf({ controle, site, agent, resultats, actions, criteres, locaux })}>
            Télécharger le PDF
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center">
            <p className="text-sm text-gray-500">Taux de conformité</p>
            <ConformiteGauge value={controle.tauxConformite || 0} threshold={site?.seuilCible || 90} />
          </Card>
          <Card className="text-center">
            <p className="text-sm text-gray-500">Seuil cible</p>
            <p className="text-3xl font-bold">{site?.seuilCible || 90}%</p>
          </Card>
          <Card className="text-center">
            <p className="text-sm text-gray-500">Actions correctives</p>
            <p className="text-3xl font-bold">{actions.length}</p>
          </Card>
        </div>

        <Card>
          <h2 className="text-lg font-semibold mb-4">Résultats ({resultats.length})</h2>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {resultats.map((r: any) => {
              const c = criteres.find((x: any) => x.id === r.critereId);
              const l = locaux.find((x: any) => x.id === r.localId);
              return (
                <div key={r.id} className="p-2 bg-gray-50 rounded border border-gray-200 flex justify-between items-center text-sm">
                  <div><p className="font-medium">{c?.libelle}</p><p className="text-xs text-gray-500">{l?.nom}</p></div>
                  <Badge variant={r.note === 'Conforme' ? 'success' : r.note === 'Non conforme' ? 'danger' : r.note === 'Partiellement conforme' ? 'warning' : 'default'}>{r.note}</Badge>
                </div>
              );
            })}
          </div>
        </Card>

        {actions.length > 0 && (
          <Card>
            <h2 className="text-lg font-semibold mb-4">Actions correctives ({actions.length})</h2>
            <div className="space-y-2">
              {actions.map((a: any) => (
                <div key={a.id} className="p-3 bg-gray-50 rounded border border-gray-200">
                  <div className="flex justify-between items-start gap-2">
                    <div><p className="font-medium">{a.descriptionNc}</p><p className="text-sm text-gray-600">{a.action}</p><p className="text-xs text-gray-500 mt-1">Échéance : {formatDate(a.echeance)}</p></div>
                    <Badge variant={a.statut === 'Soldée' ? 'success' : a.statut === 'En cours' ? 'warning' : 'danger'}>{a.statut}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {(controle.signatureControleur || controle.signatureAgent) && (
          <Card>
            <h2 className="text-lg font-semibold mb-4">Signatures</h2>
            <div className="grid grid-cols-2 gap-4">
              {controle.signatureControleur && <div><p className="text-sm text-gray-500 mb-1">Contrôleur</p><img src={controle.signatureControleur} alt="" className="border rounded" /></div>}
              {controle.signatureAgent && <div><p className="text-sm text-gray-500 mb-1">Agent évalué</p><img src={controle.signatureAgent} alt="" className="border rounded" /></div>}
            </div>
          </Card>
        )}
      </main>
      <footer className="text-center text-xs text-gray-500 py-4">Généré par Contrôle Qualité Propreté</footer>
    </div>
  );
}

function fromSnake(row: any): any {
  if (!row || typeof row !== 'object') return row;
  const out: any = {};
  for (const k in row) out[k.replace(/_([a-z])/g, (_, c) => c.toUpperCase())] = row[k];
  return out;
}

// ========== LAYOUT ==========
function ParamMenu({ links }: { links: { to: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className={`px-3 py-2 text-sm rounded flex items-center gap-1 ${open ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
      >
        Paramétrage <span className={`text-xs transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[220px] z-50">
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm hover:bg-gray-100 whitespace-nowrap"
            >{l.label}</Link>
          ))}
        </div>
      )}
    </div>
  );
}

function useOnlineStatus() {
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, []);
  return online;
}

function Layout({ children }: any) {
  const { session, signOut, isClientMode, role } = useApp();
  const uid = session?.user?.id || '';
  const [menuOpen, setMenuOpen] = useState(false);
  const online = useOnlineStatus();

  if (!session) return <>{children}</>;

  const isAdmin = role === 'admin';
  const isManager = role === 'manager';

  const mainLinks = isClientMode
    ? [
        { to: '/', label: 'Tableau de bord' },
        { to: '/sites', label: 'Mes sites' },
        { to: '/controles', label: 'Contrôles' },
        { to: '/actions', label: 'Actions' },
      ]
    : [
        { to: '/', label: 'Tableau de bord' },
        { to: '/planning', label: 'Planning' },
        { to: '/sites', label: 'Sites' },
        { to: '/controles', label: 'Contrôles' },
        { to: '/actions', label: 'Actions' },
        { to: '/analytique', label: 'Analytique' },
      ];

  const configLinks = isClientMode ? [] : [
    ...(isAdmin || isManager ? [{ to: '/criteres', label: 'Critères' }] : []),
    ...(isAdmin || isManager ? [{ to: '/templates', label: 'Templates de site' }] : []),
    ...(isAdmin || isManager ? [{ to: '/commentaires-types', label: 'Modèles de commentaires' }] : []),
    ...(isAdmin ? [{ to: '/organisation', label: 'Organisation & membres' }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {!online && (
        <div className="bg-orange-500 text-white text-center text-sm py-1.5 sticky top-0 z-50">
          ⚠ Hors-ligne — vos modifications seront sauvegardées localement et perdues si vous fermez l'onglet
        </div>
      )}
      {isDemoMode() && (
        <div className="bg-purple-600 text-white text-center text-sm py-1.5 sticky top-0 z-50">
          🚀 Mode démo — vos modifications ne seront pas enregistrées. <button onClick={() => signOut()} className="underline font-medium ml-2">Créer un vrai compte →</button>
        </div>
      )}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            <span className="font-semibold text-gray-900">Contrôle Qualité</span>
          </div>
          <nav className="hidden md:flex gap-2 items-center">
            {mainLinks.map(l => (
              <Link key={l.to} to={l.to} className="px-3 py-2 text-sm hover:bg-gray-100 rounded">{l.label}</Link>
            ))}
            {configLinks.length > 0 && <ParamMenu links={configLinks} />}
          </nav>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700 hidden lg:inline">{session.user?.email}</span>
            <button
              className="md:hidden p-2 hover:bg-gray-100 rounded"
              onClick={() => setMenuOpen(v => !v)}
              aria-label="Menu"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {menuOpen
                  ? <path strokeLinecap="round" d="M6 6l12 12M6 18L18 6" />
                  : <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
            <Button variant="ghost" onClick={() => signOut()}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <nav className="flex flex-col p-2">
              {mainLinks.map(l => (
                <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)} className="px-3 py-2 hover:bg-gray-100 rounded">{l.label}</Link>
              ))}
              {configLinks.length > 0 && (
                <>
                  <div className="px-3 py-2 mt-2 text-xs font-semibold text-gray-500 uppercase border-t border-gray-100">Paramétrage</div>
                  {configLinks.map(l => (
                    <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)} className="px-3 py-2 hover:bg-gray-100 rounded text-sm">{l.label}</Link>
                  ))}
                </>
              )}
            </nav>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>

      {isDemoMode() && <WelcomeModal userId={uid} role={role} />}

      <footer className="bg-white border-t border-gray-200 py-2 text-center text-xs text-gray-500">
        © 2026 Contrôle Qualité Propreté
      </footer>
    </div>
  );
}

// ========== APP ==========
function RequireAuth({ children }: any) {
  const { session, loading } = useApp();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Chargement...</div>;
  if (!session) return <LandingPage />;
  return children;
}

function Page({ scope, children }: { scope: string; children: React.ReactNode }) {
  return (
    <ErrorBoundary scope={scope}>
      <RequireAuth>{children}</RequireAuth>
    </ErrorBoundary>
  );
}

function AppRoutes() {
  const location = useLocation();
  const isPublic = location.pathname.startsWith('/public/');

  if (isPublic) {
    return (
      <ErrorBoundary scope="public">
        <Routes>
          <Route path="/public/:token" element={<PublicReportPage />} />
        </Routes>
      </ErrorBoundary>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/login" element={<ErrorBoundary scope="login"><LoginPage /></ErrorBoundary>} />
        <Route path="/" element={<Page scope="dashboard"><DashboardPage /></Page>} />
        <Route path="/sites" element={<Page scope="sites"><SitesPage /></Page>} />
        <Route path="/sites/nouveau" element={<Page scope="site-form"><SiteFormPage /></Page>} />
        <Route path="/sites/import" element={<Page scope="sites-import"><SitesImportPage /></Page>} />
        <Route path="/sites/:id/edit" element={<Page scope="site-form"><SiteFormPage /></Page>} />
        <Route path="/sites/:id" element={<Page scope="site-detail"><SiteDetailPage /></Page>} />
        <Route path="/criteres" element={<Page scope="criteres"><CriteresPage /></Page>} />
        <Route path="/templates" element={<Page scope="templates"><TemplatesPage /></Page>} />
        <Route path="/commentaires-types" element={<Page scope="commentaires-types"><CommentairesTypesPage /></Page>} />
        <Route path="/planning" element={<Page scope="planning"><PlanningPage /></Page>} />
        <Route path="/analytique" element={<Page scope="analytique"><AnalytiquePage /></Page>} />
        <Route path="/organisation" element={<Page scope="organisation"><OrganisationPage /></Page>} />
        <Route path="/controles" element={<Page scope="controles"><ControlesPage /></Page>} />
        <Route path="/controles/nouveau" element={<Page scope="nouveau-controle"><NouveauControlePage /></Page>} />
        <Route path="/controles/:id" element={<Page scope="controle-detail"><ControleDetailPage /></Page>} />
        <Route path="/actions" element={<Page scope="actions"><ActionsPage /></Page>} />
        <Route path="*" element={<Page scope="dashboard"><DashboardPage /></Page>} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <GlobalErrorBoundary>
      <AppProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AppProvider>
    </GlobalErrorBoundary>
  );
}

export default App;