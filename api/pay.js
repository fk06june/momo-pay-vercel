/**
 * ============================================================
 *  API WhatsApp Cloud (Meta) — appel REST brut, sans SDK.
 *  Doc officielle : https://developers.facebook.com/docs/whatsapp/cloud-api
 * ============================================================
 *
 * Endpoint appelé : POST https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages
 * Authentification : header "Authorization: Bearer {ACCESS_TOKEN}" (OAuth token,
 *                     PAS une clé API classique).
 * Corps de requête (JSON) :
 * {
 *   "messaging_product": "whatsapp",
 *   "to": "25761124458",
 *   "type": "text",
 *   "text": { "body": "..." }
 * }
 */

const GRAPH_API_VERSION = "v21.0";

function generateTxId() {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  const d = new Date();
  const y = String(d.getFullYear()).slice(2);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `MP-${y}${m}${day}-${rand}`;
}

/**
 * Envoie un message WhatsApp via l'API Cloud de Meta.
 * `to` est un numéro international SANS "+" (ex: "25761124458").
 */
async function sendWhatsAppMessage(to, body) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    throw new Error(
      "Variables manquantes : WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID."
    );
  }

  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body },
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    // L'API Meta renvoie les erreurs dans data.error.message
    throw new Error(data.error?.message || "Échec de l'envoi WhatsApp.");
  }
  return data;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ message: "Méthode non autorisée." });
    return;
  }

  const { provider, amount, phone } = req.body || {};

  if (!["lumicash", "ecocash"].includes(provider)) {
    res.status(400).json({ message: "Opérateur non reconnu." });
    return;
  }
  if (!amount || amount < 500) {
    res.status(400).json({ message: "Montant minimum : 500 FBu." });
    return;
  }
  if (!phone || !/^\+257\d{8}$/.test(phone)) {
    res.status(400).json({ message: "Numéro de téléphone invalide." });
    return;
  }

  // Simule le temps de traitement d'une transaction Mobile Money réelle
  await new Promise((resolve) => setTimeout(resolve, 900));

  // Simule un échec occasionnel (réseau opérateur, solde insuffisant, etc.)
  if (Math.random() < 0.05) {
    res.status(402).json({ message: "Transaction refusée par l'opérateur. Réessaie." });
    return;
  }

  const transactionId = generateTxId();
  const providerLabel = provider === "lumicash" ? "Lumicash" : "EcoCash";

  // Notifie le marchand (toi) sur WhatsApp via l'API Cloud de Meta
  const merchantNumber = process.env.MERCHANT_WHATSAPP_TO; // ex: "25761124458"
  let whatsappSent = false;
  let whatsappError = null;
  if (merchantNumber) {
    try {
      await sendWhatsAppMessage(
        merchantNumber,
        `💰 Nouveau paiement reçu\n` +
          `Opérateur : ${providerLabel}\n` +
          `Montant : FBu ${Number(amount).toLocaleString("fr-FR")}\n` +
          `Client : ${phone}\n` +
          `Référence : ${transactionId}`
      );
      whatsappSent = true;
    } catch (err) {
      console.error("Échec envoi WhatsApp:", err.message);
      whatsappError = err.message;
      // On ne bloque pas le paiement si la notification échoue.
    }
  }

  res.status(200).json({ transactionId, whatsappSent, whatsappError });
};
