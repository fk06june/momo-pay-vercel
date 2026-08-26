/**
 * ============================================================
 *  Webhook WhatsApp Cloud (Meta) — deux comportements distincts :
 * ============================================================
 *
 * 1) GET  → Meta appelle cette URL UNE FOIS, au moment où tu la configures
 *    dans le dashboard, pour vérifier que tu es bien le propriétaire.
 *    Elle envoie 3 paramètres en query string :
 *      ?hub.mode=subscribe&hub.verify_token=XXX&hub.challenge=123456
 *    Si "hub.verify_token" correspond à ton WHATSAPP_VERIFY_TOKEN,
 *    tu dois renvoyer littéralement la valeur de "hub.challenge"
 *    (texte brut, pas du JSON). Sinon, 403.
 *
 * 2) POST → Meta appelle cette URL à chaque événement réel (message reçu,
 *    accusé de lecture, etc.). Le corps est un JSON structuré :
 *    {
 *      "entry": [{
 *        "changes": [{
 *          "value": {
 *            "messages": [{ "from": "25761124458", "text": { "body": "..." } }]
 *          }
 *        }]
 *      }]
 *    }
 */

const GRAPH_API_VERSION = "v21.0";

async function sendWhatsAppMessage(to, body) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
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
  if (!res.ok) {
    const err = await res.json();
    console.error("Échec réponse WhatsApp:", err.error?.message);
  }
}

module.exports = async (req, res) => {
  // ---- 1) Vérification du webhook (une seule fois, à la configuration) ----
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      res.status(200).send(challenge);
    } else {
      res.status(403).send("Verify token invalide.");
    }
    return;
  }

  // ---- 2) Réception d'un message réel ----
  if (req.method === "POST") {
    const entry = req.body?.entry?.[0];
    const change = entry?.changes?.[0]?.value;
    const message = change?.messages?.[0];

    if (message) {
      const from = message.from; // numéro de l'expéditeur, ex: "25761124458"
      const text = (message.text?.body || "").trim().toLowerCase();
      console.log(`Message WhatsApp reçu de ${from}: ${text}`);

      let reply = "👋 MomoPay est bien connecté. Ton webhook WhatsApp fonctionne.";
      if (text.includes("solde")) {
        reply = "Ton solde simulé est de FBu 0 (mode test).";
      } else if (text.includes("aide") || text.includes("help")) {
        reply = "Commandes test : 'solde' · tout autre message confirme la connexion.";
      }

      try {
        await sendWhatsAppMessage(from, reply);
      } catch (err) {
        console.error(err);
      }
    }

    // Meta exige un 200 rapide, sinon il considère le webhook en échec
    // et réessaie (voire le désactive après trop d'échecs).
    res.status(200).json({ received: true });
    return;
  }

  res.status(405).send("Méthode non autorisée.");
};
