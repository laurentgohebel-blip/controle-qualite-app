# Guide d'utilisation — Client

Application : **Contrôle Qualité Propreté**
Profil : **Client** (donneur d'ordre)

En tant que client, vous accédez aux rapports de contrôle qualité réalisés sur vos sites par votre prestataire de propreté.

Deux modes d'accès selon ce que votre prestataire a choisi :

---

## Mode 1 — Compte en lecture seule (recommandé)

Vous avez un accès permanent à l'historique de vos sites.

### 1.1. Créer son compte

1. Votre prestataire vous a transmis une **URL d'application** et l'**email** sur lequel il a configuré votre accès.
2. Ouvrez l'URL sur votre ordinateur ou téléphone.
3. Cliquez sur **« Créer un compte »**.
4. Renseignez :
   - **Email** : exactement celui que votre prestataire a indiqué
   - **Mot de passe** de votre choix (6 caractères min)
   - **Laissez vide** le champ "Nom de société" — vous rejoignez l'organisation de votre prestataire
5. **« Créer mon compte »** → connexion immédiate.

### 1.2. Installer l'app sur mobile (optionnel)

- **Android (Chrome)** : ⋮ → Ajouter à l'écran d'accueil
- **iPhone (Safari)** : Partager → Sur l'écran d'accueil

### 1.3. Naviguer dans l'app

Quatre menus accessibles :

#### Tableau de bord
- KPI globaux : nombre de contrôles, contrôles ce mois, actions ouvertes, actions en retard
- **Bandeau d'alerte rouge** si vous avez des actions en retard → cliquez pour les voir

#### Mes sites
- Liste des sites pour lesquels vous avez un accès
- Cliquez sur un site pour voir :
  - Informations (adresse, responsable de secteur, fréquence de contrôle, seuil cible)
  - Liste des **locaux** du site
  - Liste des **contrôles** réalisés
  - **Graphique d'évolution** du taux de conformité dans le temps
  - **Rapport mensuel** : sélectionnez un mois → générez un PDF récapitulatif

#### Contrôles
- Historique complet de tous les contrôles de vos sites
- Filtres avancés : recherche, site, statut, période, taux min/max
- Cliquez sur un contrôle pour voir :
  - Taux de conformité, statut, nombre d'actions
  - **Résultats détaillés** : chaque critère évalué avec sa note
  - **Photos** prises sur place
  - **Signatures** du contrôleur et de l'agent évalué
  - Bouton **« Exporter PDF »** pour archivage personnel

#### Actions
- Liste des actions correctives ouvertes ou en cours sur vos sites
- Tableau de bord par statut (Ouverte / En cours / Soldée / En retard)
- Filtre pour voir uniquement les actions en retard

### 1.4. Ce que vous ne pouvez pas faire

Votre accès est en **lecture seule** :
- Pas de modification de sites, locaux, critères
- Pas de création de contrôles
- Pas d'accès à l'organisation, aux templates, à l'analytique de votre prestataire

Si vous souhaitez signaler un problème, contactez votre prestataire par les moyens habituels.

---

## Mode 2 — Lien public (sans inscription)

Votre prestataire vous a envoyé un lien type :
```
https://app.com/public/xxxxx-xxxx-xxxx
```

### 2.1. Consulter le rapport

1. Cliquez sur le lien (ordinateur ou mobile)
2. La page s'ouvre directement sur le **rapport du contrôle concerné**

Vous voyez :
- **Site, date, type** de contrôle
- **Taux de conformité** avec jauge visuelle
- **Seuil cible** du site
- **Nombre d'actions correctives**
- **Résultats détaillés** local par local avec les notes
- **Actions correctives** générées avec leur échéance et statut
- **Signatures** du contrôleur et de l'agent évalué

### 2.2. Télécharger le PDF

Bouton **« Télécharger le PDF »** en haut de la page → téléchargement immédiat d'un rapport mis en forme avec :
- Page de garde (site, date, taux)
- Tableau des résultats
- Tableau des actions correctives
- Photos jointes
- Pages signatures

### 2.3. Durée de validité

Le lien est valable **90 jours** à compter de sa génération. Au-delà, il ne fonctionnera plus — votre prestataire pourra vous en générer un nouveau si besoin.

---

## FAQ Client

**J'ai créé mon compte mais je ne vois aucun site.**
Votre prestataire ne vous a pas (encore) donné l'accès à un site. Contactez-le pour qu'il ajoute votre email aux accès clients.

**J'ai oublié mon mot de passe.**
Page de connexion → **« Mot de passe oublié ? »** → entrez votre email → vous recevez un lien pour le réinitialiser.

**Le lien public ne fonctionne plus.**
Soit il a expiré (au-delà de 90 jours), soit votre prestataire l'a révoqué. Demandez-lui un nouveau lien.

**Puis-je commenter ou contester une note ?**
Pas directement dans l'application. Contactez votre prestataire par mail/téléphone — il pourra ajuster le contrôle de son côté.

**Comment archiver les rapports ?**
Sur chaque fiche contrôle, bouton **« Exporter PDF »** → fichier téléchargeable et conservable. Les liens publics ont aussi cette fonction.

**Que faire si une action est en retard ?**
Contactez votre prestataire. L'app le notifie déjà, mais votre relance peut accélérer le traitement.

**Mes données sont-elles confidentielles ?**
Oui. Votre accès est strictement limité aux sites partagés avec vous. Les autres clients de votre prestataire ne voient pas les vôtres et inversement. La connexion est chiffrée (HTTPS) et l'authentification gérée par Supabase (standard de l'industrie).

---

*Document généré automatiquement.*
