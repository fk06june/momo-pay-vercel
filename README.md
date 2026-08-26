# MomoPay — formulaire de paiement mobile

MomoPay est une démonstration pédagogique d’un parcours de paiement mobile au Burundi. Le frontend permet de saisir un montant, de choisir Lumicash ou EcoCash, de valider un numéro burundais, puis d’afficher un reçu. Le bouton WhatsApp ouvre une conversation avec le récapitulatif prérempli.

> **Important :** le paiement est simulé. Cette version ne débite aucun compte et ne remplace pas une intégration opérateur certifiée.

## Structure du projet

| Élément | Rôle |
| --- | --- |
| `client/src/pages/Home.tsx` | Formulaire, validation, reçu et liens WhatsApp |
| `client/src/index.css` | Direction visuelle Mobile Money Editorial et responsive |
| `api/pay.js` | Fonction Vercel de simulation et notification WhatsApp Cloud |
| `api/whatsapp-webhook.js` | Vérification du webhook Meta et réponse automatique de test |
| `vercel.json` | Build Vite et dossier de sortie Vercel |
| `ideas.md` | Décisions de conception et règles de marque |

## Fonctionnement WhatsApp

Le bouton visible sur le reçu, le pied de page et le bouton flottant utilisent l’URL officielle `https://wa.me/` avec un message prérempli. Le professeur peut donc cliquer sur **WhatsApp** et envoyer le message directement depuis son téléphone ou WhatsApp Web.

Après un paiement simulé en production, `api/pay.js` peut également appeler l’API WhatsApp Cloud de Meta pour envoyer une notification au numéro du marchand. Cette notification serveur est indépendante du bouton `wa.me` du navigateur.

## Déployer sur Vercel

1. Créer un dépôt GitHub privé et y importer le contenu du projet en conservant `api/`, `client/` et `vercel.json` à la racine.
2. Dans Vercel, choisir **Add New → Project**, puis sélectionner le dépôt.
3. Laisser Vercel utiliser la configuration du projet. Le build est `pnpm build` et le dossier publié est `dist/public`.
4. Ajouter dans **Settings → Environment Variables** les variables suivantes si la notification serveur Meta est souhaitée :

| Variable | Valeur |
| --- | --- |
| `WHATSAPP_ACCESS_TOKEN` | Token d’accès Meta WhatsApp Cloud |
| `WHATSAPP_PHONE_NUMBER_ID` | Phone Number ID du numéro de test ou professionnel |
| `MERCHANT_WHATSAPP_TO` | Numéro destinataire au format international, sans `+` ni espaces |
| `WHATSAPP_VERIFY_TOKEN` | Secret choisi pour vérifier le webhook |
| `VITE_MERCHANT_WHATSAPP` | Numéro utilisé par le bouton navigateur, sans `+` ni espaces ; facultatif, la valeur de démonstration est déjà présente |

5. Redéployer après l’ajout des variables d’environnement.

## Connecter le webhook Meta

Dans le tableau de bord Meta, ouvrir **WhatsApp → Configuration → Webhooks**, puis utiliser :

- **Callback URL :** `https://VOTRE-DOMAINE-VERCEL/api/whatsapp-webhook`
- **Verify token :** la même valeur que `WHATSAPP_VERIFY_TOKEN`
- **Champ à abonner :** `messages`

Meta documente la création de l’application, l’envoi et la réception de messages, le webhook de test et le token permanent dans le guide [WhatsApp Cloud API — Get Started](https://developers.facebook.com/documentation/business-messaging/whatsapp/get-started). La structure `/api` utilisée par ce projet correspond aux fonctions Node.js documentées par [Vercel](https://vercel.com/docs/functions/runtimes/node-js).

## Test pour la présentation

Pour présenter le projet, saisir un montant d’au moins **500 FBu**, sélectionner un opérateur et entrer huit chiffres de téléphone. Cliquer sur **Confirmer via…**, puis sur **Ouvrir WhatsApp avec le récapitulatif**. Le reçu doit afficher l’opérateur, le numéro et une référence de transaction.

Si l’objectif est seulement de montrer le bouton WhatsApp au professeur, aucune clé Meta n’est nécessaire : le lien `wa.me` suffit. Les variables Meta deviennent nécessaires uniquement pour recevoir automatiquement une notification serveur après la simulation ou pour activer le webhook entrant.
