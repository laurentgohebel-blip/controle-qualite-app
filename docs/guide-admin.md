# Guide d'utilisation — Administrateur

Application : **Contrôle Qualité Propreté**
Profil : **Administrateur**

L'Admin gère toute l'organisation : membres, sites, clients, paramétrage.

---

## 1. Premier accès — créer mon compte

1. Ouvrez l'URL de l'application sur votre ordinateur ou téléphone.
2. Cliquez sur **« Créer un compte »**.
3. Renseignez :
   - **Email** professionnel
   - **Mot de passe** (minimum 6 caractères)
   - **Nom de votre société** (ex : "Propreté Service SARL")
4. Cliquez **« Créer mon compte »** → vous êtes automatiquement Admin de votre nouvelle organisation.

### Installer l'app sur mobile (PWA)

- **Android (Chrome)** : ⋮ → Ajouter à l'écran d'accueil
- **iPhone (Safari)** : Partager → Sur l'écran d'accueil

---

## 2. Inviter mes collaborateurs

1. Menu **Organisation** → carte **« Inviter un membre »**
2. Renseignez l'**email** + le **rôle** :
   - **Admin** : gestion organisation + tous les droits
   - **Manager** : valide les contrôles, gère sites/critères
   - **Contrôleur** : saisit les contrôles, soumet pour validation
3. **« + Inviter »**
4. Transmettez l'URL de l'app au collaborateur. Il crée son compte avec **exactement le même email** → il rejoint automatiquement votre organisation avec le rôle prévu.

Pour changer le rôle ou retirer un membre : menu Organisation → liste des membres → boutons à droite.

---

## 3. Créer mes sites clients

### Méthode rapide : import Excel

1. Menu **Sites** → **« 📥 Importer Excel »**
2. **Téléchargez le modèle** → remplissez vos sites et locaux dans Excel
3. Rechargez le fichier → vérifiez l'aperçu → **Lancer l'import**

### Méthode template : pré-configuration

1. Menu **Templates** → créez des modèles type "Bureau standard", "École", "Restaurant"…
2. Ajoutez locaux types + agents types + fréquence + seuil
3. Menu **Sites → + Nouveau site** → choisissez un template → tout se pré-remplit

### Méthode manuelle (1 site à la fois)

- Sites → + Nouveau site → renseignez nom, client, adresse, ville, responsable, fréquence, seuil cible, **email client** (pour rapports automatiques)
- Une fois créé : ajoutez les **locaux** (Bureau, Sanitaire, Circulation…) et les **agents** assignés au site

---

## 4. Gérer la bibliothèque de critères

Menu **Critères** :
- **Importer le pack CCN Propreté** (24 critères standard du secteur) en 1 clic
- Ou créer vos propres critères : libellé, catégorie, coefficient (1=faible, 2=moyen, 3=fort), types de locaux concernés

---

## 5. Donner un accès lecture à un client

Sur la fiche d'un site → carte **« Accès client en lecture »** → email du client → **Ajouter**.
Le client crée son compte avec ce même email → il voit uniquement ce site, en lecture seule.

---

## 6. Planification

Menu **Planning** :
- **Planifier un contrôle ponctuel** : site + date + type
- **Planification récurrente** : génère 12 contrôles d'un coup (toutes les semaines, 2 semaines, mois ou trimestre) — utile pour bloquer 3 mois d'avance
- **Calendrier mensuel** : vue d'ensemble des contrôles à venir, cliquez sur un événement pour le démarrer

---

## 7. Vue d'ensemble et analytique

- **Tableau de bord** : KPI globaux + alerte actions en retard + alerte sites en déclin
- **Analytique** :
  - **Heatmap mensuelle** : tableau sites × mois avec code couleur (rouge / jaune / vert)
  - **Top critères en échec** : où vous devez investir en formation
  - **Ranking agents** sur 3/6/12 mois : outil RH
  - **Sites en déclin** : alerte si le taux baisse 3 mois consécutifs

---

## 8. Export et reporting

- Menu **Contrôles** → **Export Excel** : 3 feuilles (Contrôles / Résultats / Actions) pour intégration ERP/CRM
- Fiche site → **Rapport mensuel** : PDF récap avec KPI, tableau des contrôles, top points faibles

---

## 9. Workflow d'approbation

Si vous activez ce mode (en mettant vos contrôleurs en rôle "Contrôleur" et vous en "Manager") :
- Le contrôleur saisit → bouton **« Soumettre pour validation »**
- Vous validez ou rejetez (avec motif) depuis la fiche du contrôle
- Une fois validé → envoi au client (mail ou lien public)

---

## 10. FAQ Admin

**Mon collaborateur n'a pas reçu son invitation.**
Aucun mail n'est envoyé automatiquement. Transmettez-lui l'URL de l'app et l'email avec lequel il doit s'inscrire.

**Un client ne peut pas se connecter.**
Vérifiez que vous lui avez bien donné l'accès lecture sur **au moins un site**. Sans ça, son compte existe mais n'a accès à rien.

**Comment supprimer un site créé par erreur ?**
Fiche du site → **Supprimer** (en haut à droite). Supprime aussi tous les contrôles, locaux, actions liés.

**Le PDF ne se télécharge pas.**
Désactivez le bloqueur de pop-up pour ce site dans votre navigateur.

---

*Document généré automatiquement.*
