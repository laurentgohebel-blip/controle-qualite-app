import { useNavigate } from 'react-router-dom';
import {
  Building2, ClipboardList, Camera, Users, BarChart3, FileCheck,
  Shield, Zap, ChevronRight, Check, Calendar, Smartphone,
} from 'lucide-react';
import { Explainer } from './Explainer';

export function LandingPage() {
  const navigate = useNavigate();

  const startDemo = () => {
    localStorage.setItem('demo-mode', '1');
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('welcome-seen-') || k.startsWith('onboarding-dismissed-')) localStorage.removeItem(k);
    });
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-7 h-7 text-blue-600" />
            <span className="font-bold text-gray-900">Contrôle Qualité Propreté</span>
          </div>
          <nav className="hidden md:flex gap-6 text-sm">
            <a href="#fonctionnalites" className="text-gray-600 hover:text-gray-900">Fonctionnalités</a>
            <a href="#tarifs" className="text-gray-600 hover:text-gray-900">Tarifs</a>
            <a href="#faq" className="text-gray-600 hover:text-gray-900">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/login')} className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2">Se connecter</button>
            <button onClick={startDemo} className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Essayer →</button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-6xl mx-auto px-4 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm mb-6">
            <Zap className="w-4 h-4" />
            Spécialement pensé pour les sociétés de propreté
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Le contrôle qualité<br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              qui fait la différence
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            Saisissez vos contrôles depuis le terrain, générez des rapports PDF professionnels,
            suivez vos actions correctives et gardez vos clients informés. Tout depuis votre téléphone.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button onClick={startDemo} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition shadow flex items-center gap-2">
              🚀 Voir la démo sans inscription <ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={() => navigate('/login')} className="px-6 py-3 bg-white border-2 border-gray-300 rounded-lg font-medium hover:border-blue-500">
              Créer mon compte
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-4">Aucune carte bancaire requise · Données fictives en démo</p>
        </div>
      </section>

      {/* Explainer animé */}
      <section className="bg-white py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-8">
            <p className="text-sm font-semibold text-blue-600 mb-2">VISITE GUIDÉE</p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">L'app en 25 secondes</h2>
          </div>
          <Explainer />
        </div>
      </section>

      {/* Stats / bénéfices clés */}
      <section className="bg-white border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-3xl md:text-4xl font-bold text-blue-600">-60%</p>
            <p className="text-sm text-gray-600 mt-1">Temps de saisie d'un contrôle</p>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-bold text-blue-600">100%</p>
            <p className="text-sm text-gray-600 mt-1">De vos données accessibles partout</p>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-bold text-blue-600">0€</p>
            <p className="text-sm text-gray-600 mt-1">Pour démarrer (essai illimité)</p>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-bold text-blue-600">24/7</p>
            <p className="text-sm text-gray-600 mt-1">Accès lecture pour vos clients</p>
          </div>
        </div>
      </section>

      {/* Fonctionnalités */}
      <section id="fonctionnalites" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Tout ce dont vous avez besoin</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              De la planification au rapport client final, gérez votre activité de contrôle qualité
              de bout en bout avec une seule application.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Feature icon={<ClipboardList className="w-6 h-6" />} title="Saisie 3 étapes"
              desc="Sélection des locaux, évaluation par critères pondérés (Conforme / Partiel / Non conforme), récap. Le taux de conformité est calculé automatiquement." />
            <Feature icon={<Camera className="w-6 h-6" />} title="Photos terrain & signatures"
              desc="Capture photo depuis l'appareil, signature électronique du contrôleur et de l'agent évalué. Tout intégré au rapport PDF." />
            <Feature icon={<Calendar className="w-6 h-6" />} title="Planning récurrent"
              desc="Planifiez en 1 clic « tous les lundis pendant 3 mois ». Calendrier mensuel, alertes contrôles en retard." />
            <Feature icon={<FileCheck className="w-6 h-6" />} title="Rapports client automatiques"
              desc="PDF professionnel avec KPI, photos, signatures. Envoi par email ou lien public sécurisé 90 jours." />
            <Feature icon={<BarChart3 className="w-6 h-6" />} title="Analytique métier"
              desc="Heatmap des sites, top critères en échec, ranking agents, détection des sites en déclin. Outil de pilotage." />
            <Feature icon={<Users className="w-6 h-6" />} title="Multi-utilisateurs & rôles"
              desc="Admin, manager, contrôleur. Workflow d'approbation. Accès lecture pour vos clients sur leurs sites." />
            <Feature icon={<Smartphone className="w-6 h-6" />} title="Mobile-first PWA"
              desc="Installable sur téléphone (iOS/Android), interface tactile, mode hors-ligne avec sauvegarde locale." />
            <Feature icon={<Shield className="w-6 h-6" />} title="Données sécurisées"
              desc="Hébergement Europe, authentification chiffrée, isolation stricte entre organisations. RGPD-friendly." />
            <Feature icon={<Zap className="w-6 h-6" />} title="Templates & Import Excel"
              desc="Bibliothèque CCN Propreté pré-remplie. Templates de sites types. Import en masse depuis Excel." />
          </div>
        </div>
      </section>

      {/* CTA intermédiaire */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Voyez-le par vous-même</h2>
          <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
            Pas envie de remplir un formulaire ? La démo s'ouvre instantanément avec
            des données fictives. Vous explorez, vous testez, vous décidez.
          </p>
          <button onClick={startDemo} className="px-8 py-4 bg-white text-blue-600 rounded-lg font-medium hover:shadow-2xl transition shadow-lg text-lg">
            🚀 Démarrer la démo
          </button>
        </div>
      </section>

      {/* Tarifs */}
      <section id="tarifs" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Une offre simple</h2>
            <p className="text-gray-600">Sans engagement, sans paliers cachés.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <PricingCard
              name="Découverte"
              price="0 €"
              period="à vie"
              features={[
                '1 site',
                '1 contrôleur',
                '10 contrôles / mois',
                'Rapports PDF',
                'Support communauté',
              ]}
              cta="Commencer gratuitement"
              ctaAction={() => navigate('/login')}
            />
            <PricingCard
              name="Pro"
              price="29 €"
              period="/ mois"
              highlighted
              features={[
                '20 sites inclus',
                '5 utilisateurs',
                'Contrôles illimités',
                'Accès clients en lecture',
                'Export Excel + analytique',
                'Support email prioritaire',
              ]}
              cta="Essayer 14 jours gratuits"
              ctaAction={() => navigate('/login')}
            />
            <PricingCard
              name="Entreprise"
              price="Sur devis"
              period=""
              features={[
                'Sites & utilisateurs illimités',
                'Marque blanche',
                'API sur mesure',
                'Onboarding dédié',
                'Support téléphonique',
                'SLA contractuel',
              ]}
              cta="Nous contacter"
              ctaAction={() => window.location.href = 'mailto:contact@cqp.fr?subject=Demande%20Entreprise'}
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-10 text-center">Questions fréquentes</h2>
          <div className="space-y-4">
            <FAQ q="Faut-il une carte bancaire pour la démo ?"
              a="Non. La démo s'ouvre instantanément avec des données fictives. Vous explorez l'application en toute liberté sans inscription." />
            <FAQ q="Mes données sont-elles sécurisées ?"
              a="Oui. Authentification chiffrée, hébergement sur infrastructure européenne, isolation stricte entre organisations (Row-Level Security PostgreSQL), conformité RGPD." />
            <FAQ q="Puis-je inviter mes collaborateurs ?"
              a="Bien sûr. Le plan Pro inclut jusqu'à 5 utilisateurs avec gestion des rôles (Admin, Manager, Contrôleur). Le plan Entreprise est illimité." />
            <FAQ q="Comment fonctionne l'accès client ?"
              a="Vous pouvez soit donner un compte permanent en lecture à votre client (il voit ses sites uniquement), soit lui envoyer un lien public sécurisé pour un rapport ponctuel." />
            <FAQ q="L'application fonctionne-t-elle hors-ligne ?"
              a="Oui. C'est une PWA installable sur iOS/Android. Si vous perdez la connexion en plein contrôle, votre saisie est sauvegardée localement et reprend dès que vous êtes reconnecté." />
            <FAQ q="Puis-je importer mes données existantes ?"
              a="Oui. Un import Excel est inclus pour migrer vos sites et locaux en quelques minutes. Un modèle prêt à l'emploi est fourni." />
            <FAQ q="Puis-je annuler à tout moment ?"
              a="Oui, sans engagement. Vous gardez l'accès jusqu'à la fin de la période payée, puis votre compte passe en mode lecture seule." />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-6 h-6 text-blue-400" />
                <span className="font-bold text-white">Contrôle Qualité Propreté</span>
              </div>
              <p className="text-sm">L'application qui transforme votre activité de contrôle qualité.</p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-3">Produit</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#fonctionnalites" className="hover:text-white">Fonctionnalités</a></li>
                <li><a href="#tarifs" className="hover:text-white">Tarifs</a></li>
                <li><button onClick={startDemo} className="hover:text-white">Démo</button></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-3">Contact</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="mailto:contact@cqp.fr" className="hover:text-white">contact@cqp.fr</a></li>
                <li><a href="#" className="hover:text-white">Mentions légales</a></li>
                <li><a href="#" className="hover:text-white">Confidentialité</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 text-sm text-center">
            © 2026 Contrôle Qualité Propreté · Tous droits réservés
          </div>
        </div>
      </footer>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition">
      <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
    </div>
  );
}

function PricingCard({ name, price, period, features, cta, ctaAction, highlighted }: any) {
  return (
    <div className={`p-6 rounded-xl border-2 ${highlighted ? 'border-blue-600 bg-blue-50 shadow-lg scale-105' : 'border-gray-200 bg-white'} flex flex-col`}>
      {highlighted && <span className="inline-block bg-blue-600 text-white text-xs px-3 py-1 rounded-full self-start mb-3">Le plus populaire</span>}
      <h3 className="text-xl font-bold text-gray-900">{name}</h3>
      <div className="mt-3 mb-6">
        <span className="text-4xl font-bold text-gray-900">{price}</span>
        {period && <span className="text-gray-500 ml-1">{period}</span>}
      </div>
      <ul className="space-y-2 mb-6 flex-1">
        {features.map((f: string, i: number) => (
          <li key={i} className="flex gap-2 text-sm text-gray-700"><Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" /> {f}</li>
        ))}
      </ul>
      <button
        onClick={ctaAction}
        className={`w-full py-3 rounded-lg font-medium ${highlighted ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}
      >
        {cta}
      </button>
    </div>
  );
}

function FAQ({ q, a }: { q: string; a: string }) {
  return (
    <details className="bg-white p-5 rounded-lg border border-gray-200 group">
      <summary className="font-medium text-gray-900 cursor-pointer flex justify-between items-center">
        {q}
        <span className="text-gray-400 group-open:rotate-180 transition">▼</span>
      </summary>
      <p className="mt-3 text-sm text-gray-600 leading-relaxed">{a}</p>
    </details>
  );
}
