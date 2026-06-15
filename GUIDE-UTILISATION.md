# Guide d'utilisation — Contrôle Qualité Propreté

Application web (PWA) de contrôle qualité pour sociétés de propreté.
Trois profils utilisateurs : **Admin**, **Manager**, **Contrôleur**, plus l'**accès Client en lecture**.

---

## Sommaire

1. [Premiers pas — Inscription](#1-premiers-pas--inscription)
2. [Guide Admin](#2-guide-admin)
3. [Guide Manager](#3-guide-manager)
4. [Guide Contrôleur](#4-guide-contrôleur)
5. [Guide Client](#5-guide-client)
6. [FAQ](#6-faq)

---

## 1. Premiers pas — Inscription

### Créer son compte (1ère utilisation)

1. Ouvrez l'URL de l'application sur votre ordinateur ou téléphone.
2. Cliquez sur **« Créer un compte »**.
3. Renseignez :
   - **Email** professionnel
   - **Mot de passe** (minimum 6 caractères)
   - **Nom de votre société** (ex : "Propreté Service SARL") — ne remplissez ce champ **que si vous créez votre propre société**.
   - Si vous avez reçu une invitation d'un collègue/manager, **laissez ce champ vide** : vous rejoindrez automatiquement leur organisation.
4. Cliquez **« Créer mon compte »**.

Vous êtes automatiquement connecté, et :
- **Avec un nom de société renseigné** → vous êtes Admin de votre nouvelle organisation
- **Sans nom de société (invitation)** → vous rejoignez l'organisation invitante avec le rôle qui vous a été attribué

### Se reconnecter

1. Allez sur l'URL → **« Se connecter »** → email + mot de passe.
2. Vous oubliez votre mot de passe ? Cliquez **« Mot de passe oublié ? »** → vous recevez un email pour le réinitialiser.

### Installer l'app sur le téléphone (PWA)

- **Android (Chrome)** : appuyez sur **⋮ → Ajouter à l'écran d'accueil**
- **iPhone (Safari)** : appuyez sur **Partager → Sur l'écran d'accueil**

L'app s'ouvre alors comme une vraie application, en plein écran.

---

## 2. Guide Admin

L'Admin gère toute l'organisation : membres, sites, clients, paramétrage.

### 2.1. Inviter mes collaborateurs

1. Menu **Organisation** → carte **« Inviter un membre »**
2. Renseignez l'**email** du collaborateur + le **rôle** :
   - **Admin** : gestion organisation + tous les droits
   - **Manager** : valide les contrôles, gère sites/critères
   - **Contrôleur** : saisit les contrôles, soumet pour validation
3. Cliquez **« + Inviter »**.
4. Transmettez l'URL de l'app au collaborateur. Il crée son compte avec **exactement le même email** → il est automatiquement rattaché à votre organisation avec le rôle prévu.

Pour **changer le rôle** ou **retirer un membre** : menu Organisation → liste des membres → bouton à droite.

### 2.2. Créer mes sites clients

**Méthode rapide : import Excel**
1. Menu **Sites** → bouton **« 📥 Importer Excel »**
2. **Téléchargez le modèle** → ouvrez-le dans Excel → remplissez vos sites (feuille **Sites**) et locaux (feuille **Locaux**)
3. Chargez votre fichier → vérifiez l'aperçu → **Lancer l'import**

**Méthode template : pré-configuration**
1. Menu **Templates** → créez des modèles type "Bureau standard", "École", "Restaurant"…
2. Ajoutez les locaux types (Hall, Sanitaires, Bureaux…) + agents types
3. Menu **Sites → + Nouveau site** → choisissez un template → tout se pré-remplit

**Méthode manuelle (1 site à la fois)**
- **Sites → + Nouveau site** → renseignez nom, client, adresse, ville, responsable, fréquence, seuil cible, email client (pour rapports automatiques)
- Une fois créé : ajoutez les **locaux** (Bureau, Sanitaire, Circulation…) et les **agents** assignés au site

### 2.3. Gérer la bibliothèque de critères

Menu **Critères** :
- **Importer le pack CCN Propreté** (24 critères standard du secteur) en 1 clic
- Ou créer vos propres critères : libellé, catégorie, coefficient (1=faible, 2=moyen, 3=fort), types de locaux concernés

### 2.4. Donner un accès lecture à un client

Sur la fiche d'un site → carte **« Accès client en lecture »** → email du client → **Ajouter**.
Le client crée son compte avec ce même email → il voit uniquement ce site, en lecture seule.

### 2.5. Vue d'ensemble

- **Tableau de bord** : KPI globaux + alerte actions en retard + alerte sites en déclin
- **Analytique** : heatmap mensuelle tous sites, top critères en échec, ranking des agents — outil de décision RH/formation
- **Planning** : calendrier des contrôles à venir, planification ponctuelle ou récurrente

---

## 3. Guide Manager

Le Manager fait la même chose qu'un contrôleur, **plus** :
- Validation des contrôles soumis par les contrôleurs
- Gestion des sites, locaux, agents, critères, templates

### Valider un contrôle

1. Menu **Contrôles** → filtre statut **« À valider »**
2. Ouvrez le contrôle → vérifiez les résultats
3. Bouton **« ✓ Valider »** (en haut de la page) — le contrôle passe en "Validé"
4. Si problème : **« ✗ Rejeter »** → entrez le motif → le contrôleur retrouve le contrôle en statut "Brouillon" pour le reprendre

### Envoyer le rapport au client

Une fois validé, sur la fiche du contrôle :
- **« 📧 Envoyer »** : ouvre votre client mail avec destinataire + objet + corps pré-remplis, le PDF est téléchargé pour être joint
- **« 🔗 Lien client »** : génère un lien web sécurisé (valide 90 jours) que vous copiez/collez dans un mail/SMS — le client clique et voit le rapport sans s'inscrire
- **« Exporter PDF »** : télécharge le rapport pour archivage

---

## 4. Guide Contrôleur

Le contrôleur est sur le terrain. Son rôle : saisir les contrôles et les soumettre pour validation.

### 4.1. Démarrer un contrôle

**Depuis un contrôle planifié** :
1. Menu **Planning** → repérez votre contrôle (ou cliquez sur la pastille du calendrier)
2. Bouton **« Démarrer »**

**Sans planification** :
1. Tableau de bord → bouton **« Nouveau contrôle »**
2. Choisissez le site et le type (Programmé / Inopiné / Contradictoire client)

### 4.2. Saisie en 3 étapes

**Étape 1 — Informations**
- Site, date, type, agent évalué
- **Cochez les locaux à contrôler** parmi ceux du site

**Étape 2 — Évaluation par local**
Pour chaque local sélectionné :
- Pour chaque critère qui s'applique : choisissez la note
  - **Conforme** (vert) : tout est OK
  - **Partiellement conforme** (jaune) : un défaut mineur
  - **Non conforme** (rouge) : problème significatif → générera une action corrective automatique
  - **Non applicable** (gris) : ce critère ne concerne pas ce local
- **Ajoutez un commentaire** si pertinent
- Bouton **« 📷 Photo »** : prend une photo (utilise l'appareil du téléphone) — utile pour les non-conformités

Quand tous les critères sont notés → **« Local suivant → »** ou **« Continuer → »**.

**Étape 3 — Récapitulatif**
- Le **taux de conformité** est calculé automatiquement (pondéré par les coefficients des critères)
- Ajoutez un **commentaire général** si besoin
- **« Valider le contrôle ✓ »** → enregistré, vous arrivez sur la fiche détaillée

### 4.3. Signatures

Sur la fiche du contrôle, en bas :
- Signez dans la zone **« Contrôleur »**
- Faites signer l'agent évalué dans la zone **« Agent évalué »** (au doigt sur tablette ou téléphone)
- **« Enregistrer les signatures »** → le contrôle passe en statut "Validé"

### 4.4. Soumettre pour validation manager

Si votre organisation utilise le workflow d'approbation :
- Une fois le contrôle Terminé → bouton **« Soumettre pour validation »**
- Votre manager reçoit le contrôle, le valide ou le rejette
- Si rejeté : vous le retrouverez en statut "Brouillon" avec le motif du manager dans le commentaire général

### 4.5. Hors-ligne

- Si vous perdez la connexion (sous-sol, parking…) un bandeau orange apparaît en haut.
- Votre saisie reste sauvegardée localement sur votre téléphone.
- **Important** : ne fermez pas l'onglet tant que vous êtes hors-ligne, et terminez/sauvegardez dès que vous retrouvez du réseau.

### 4.6. Suivre les actions correctives

Menu **Actions** :
- Liste de toutes les actions correctives générées par vos NC
- Cliquez **« En cours »** quand vous commencez à traiter une action
- Cliquez **« Soldée »** quand c'est terminé
- Bouton **« Notifier »** sur une action : envoie un email au responsable assigné (si email renseigné)

---

## 5. Guide Client

### 5.1. Avec un compte (vue continue)

Si votre prestataire vous a donné un accès :
1. Allez sur l'URL de l'application
2. **Créer un compte** avec l'email exact qu'il vous a indiqué
3. Choisissez un mot de passe
4. **Laissez vide le "Nom de société"** (vous ne créez pas votre propre organisation, vous rejoignez la sienne)

À chaque connexion vous voyez :
- **Tableau de bord** : KPI sur vos sites
- **Mes sites** : la liste des sites auxquels vous avez accès
- **Contrôles** : l'historique complet des contrôles réalisés sur vos sites — cliquez pour voir résultats, photos, signatures
- **Actions** : suivi des actions correctives ouvertes

Vous n'avez **aucun droit de modification** — c'est une vue lecture seule.

### 5.2. Sans compte (lien public)

Votre prestataire vous a envoyé un lien type `https://app.com/public/<token>` :
1. Cliquez sur le lien
2. La page s'ouvre directement sur le rapport du contrôle concerné
3. Vous voyez : taux de conformité, résultats détaillés, actions correctives, signatures
4. Bouton **« Télécharger le PDF »** pour archiver

Le lien est valable **90 jours**. Au-delà, votre prestataire pourra vous en générer un nouveau.

---

## 6. FAQ

**Q : J'ai oublié mon mot de passe.**
Page de login → **« Mot de passe oublié ? »** → entrez votre email → vous recevez un lien de réinitialisation.

**Q : Mon collègue n'a pas reçu son invitation.**
L'invitation n'envoie pas de mail. Il faut juste lui transmettre l'URL de l'app et l'email avec lequel il doit s'inscrire — votre organisation l'attendra.

**Q : Le PDF ne se télécharge pas.**
Vérifiez que les bloqueurs de pop-up de votre navigateur sont désactivés pour ce site.

**Q : La photo ne fonctionne pas sur mon téléphone.**
Autorisez l'accès à l'appareil photo dans les paramètres du navigateur (icône cadenas à gauche de l'URL).

**Q : Comment supprimer un site qu'on a créé par erreur ?**
Fiche du site → bouton **« Supprimer »** (en haut à droite). Attention : supprime aussi tous les contrôles, locaux, actions liés. Réservé aux Admin/Manager.

**Q : Peut-on personnaliser les critères ?**
Oui — menu **Critères**. Vous pouvez ajouter, modifier, supprimer, et combiner avec le pack CCN Propreté standard.

**Q : Comment générer un rapport mensuel pour un client ?**
Fiche d'un site → carte **« Rapport mensuel »** → sélectionnez le mois → **Générer** → un PDF se télécharge avec le récap du mois (KPI, tableau, points faibles).

**Q : Comment voir les statistiques globales ?**
Menu **Analytique** : heatmap mensuelle, top critères en échec, ranking agents, détection sites en déclin (taux qui baisse 3 mois de suite).

**Q : Comment exporter toutes mes données vers Excel ?**
Menu **Contrôles** → bouton **« Export Excel »** → un fichier .xlsx avec 3 feuilles (Contrôles / Résultats / Actions).

---

*Pour toute question, contactez votre administrateur d'organisation.*
