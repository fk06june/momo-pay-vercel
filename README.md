# MomoPay — formulaire de paiement Mobile Money

MomoPay est un formulaire de démonstration pour Lumicash et EcoCash au Burundi. Le paiement est simulé : aucun fonds réel n’est débité. Après la confirmation, un reçu est affiché et un bouton permet d’ouvrir WhatsApp avec un message prérempli.

## Structure

| Fichier | Rôle |
| --- | --- |
| `index.html` | Page frontend originale et formulaire |
| `css/style.css` | Style visuel original MomoPay |
| `js/app.js` | Validation du formulaire, simulation et lien WhatsApp |
| `api/pay.js` | Fonction Vercel : validation et notification WhatsApp Cloud |
| `api/whatsapp-webhook.js` | Vérification du webhook Meta et réponse automatique de test |
| `vercel.json` | Configuration de réécriture Vercel |

## Bouton WhatsApp

Le bouton flottant et le bouton du reçu reprennent la méthode de `whatsapp-direct.html` : le message est encodé, puis ouvert avec `window.open`. Sur ordinateur, la destination est WhatsApp Web ; sur téléphone, le protocole `whatsapp://send` cible l’application installée. Le numéro configuré est `+25761703633`, stocké dans le code sans `+` ni espaces.

## Déploiement sur Vercel

Importez ce dépôt GitHub dans Vercel avec **Add New → Project**. Comme il s’agit d’un frontend HTML/CSS/JavaScript sans étape de build, laissez le framework sur **Other** et ne renseignez pas de commande de build. Le dossier `api/` sera détecté comme fonctions Vercel.

Pour activer la notification serveur WhatsApp Cloud après une transaction, ajoutez les variables suivantes dans les paramètres Vercel :

| Variable | Valeur attendue |
| --- | --- |
| `WHATSAPP_ACCESS_TOKEN` | Token d’accès Meta WhatsApp Cloud |
| `WHATSAPP_PHONE_NUMBER_ID` | Identifiant du numéro WhatsApp Cloud |
| `MERCHANT_WHATSAPP_TO` | Numéro destinataire international, sans `+` ni espaces |
| `WHATSAPP_VERIFY_TOKEN` | Valeur secrète choisie pour le webhook |

Le paiement reste une simulation tant qu’un véritable opérateur Mobile Money n’est pas connecté. Meta explique la création de l’application, l’envoi/réception de messages, le webhook et les tokens dans son guide [WhatsApp Cloud API — Get Started](https://developers.facebook.com/documentation/business-messaging/whatsapp/get-started). Vercel documente le déploiement des fonctions Node.js dans le dossier [`/api`](https://vercel.com/docs/functions/runtimes/node-js).

## Test de présentation

Saisissez un montant d’au moins 500 FBu, sélectionnez Lumicash ou EcoCash, entrez huit chiffres de téléphone, puis cliquez sur **Confirmer via…**. Dans le reçu, cliquez sur **Confirmer sur WhatsApp**. Pour le webhook entrant, configurez dans Meta l’URL `https://VOTRE-DOMAINE/api/whatsapp-webhook` avec le même `WHATSAPP_VERIFY_TOKEN`, puis abonnez le champ `messages`.
