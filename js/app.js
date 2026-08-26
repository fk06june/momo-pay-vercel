(() => {
  const MERCHANT_WHATSAPP = "25761703633"; // indicatif + numéro, sans "+" ni espaces

  function buildWhatsAppUrl(message) {
    const encodedMessage = encodeURIComponent(message);
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    // Méthode reprise de whatsapp-direct.html : l’appareil ouvre WhatsApp
    // via le protocole applicatif, tandis que l’ordinateur ouvre WhatsApp Web.
    return isMobile
      ? `whatsapp://send?phone=${MERCHANT_WHATSAPP}&text=${encodedMessage}`
      : `https://web.whatsapp.com/send?phone=${MERCHANT_WHATSAPP}&text=${encodedMessage}`;
  }

  function openWhatsApp(message) {
    const whatsappUrl = buildWhatsAppUrl(message);
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  }

  function setWhatsAppAction(element, message) {
    if (!element) return;
    element.href = buildWhatsAppUrl(message);
    element.addEventListener("click", (event) => {
      event.preventDefault();
      openWhatsApp(message);
    });
  }

  const directWhatsAppLink = document.querySelector(".wa-fab");
  setWhatsAppAction(directWhatsAppLink, "Bonjour, j'ai une question sur un paiement MomoPay.");

  const PROVIDERS = {
    lumicash: { label: "Lumicash" },
    ecocash: { label: "EcoCash" },
  };

  let provider = "lumicash";

  const form = document.getElementById("pay-form");
  const receipt = document.getElementById("receipt");

  const amountInput = document.getElementById("amount");
  const amountError = document.getElementById("amount-error");
  const phoneInput = document.getElementById("phone");
  const phoneError = document.getElementById("phone-error");
  const formError = document.getElementById("form-error");
  const submitBtn = document.getElementById("submit-btn");
  const submitLabel = document.getElementById("submit-label");
  const providerLabelEl = document.getElementById("provider-label");
  const providerBtns = document.querySelectorAll(".provider-btn");
  const liveRegion = document.getElementById("live-region");
  const resetBtn = document.getElementById("reset-btn");
  const weatherInfo = document.getElementById("weather-info");
  const WEATHER_URL =
    "https://api.open-meteo.com/v1/forecast?latitude=-3.3731&longitude=29.9189" +
    "&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m" +
    "&timezone=Africa%2FBujumbura";

  function weatherCodeToLabel(code) {
    if (code === 0) return "Ciel dégagé";
    if ([1, 2, 3].includes(code)) return "Partiellement nuageux";
    if ([45, 48].includes(code)) return "Brouillard";
    if ([51, 53, 55, 56, 57].includes(code)) return "Bruine";
    if ([61, 63, 65, 66, 67].includes(code)) return "Pluie";
    if ([71, 73, 75, 77].includes(code)) return "Neige";
    if ([80, 81, 82].includes(code)) return "Averses";
    if ([95, 96, 99].includes(code)) return "Orage";
    return "Conditions variables";
  }

  async function getWeather() {
    if (!weatherInfo) return;

    try {
      const response = await fetch(WEATHER_URL);
      if (!response.ok) throw new Error("Réponse météo indisponible.");

      const data = await response.json();
      const current = data.current;
      if (!current) throw new Error("Données météo incomplètes.");

      const temperature = Number(current.temperature_2m).toLocaleString("fr-FR", {
        maximumFractionDigits: 1,
      });
      const humidity = Number(current.relative_humidity_2m).toLocaleString("fr-FR");
      const wind = Number(current.wind_speed_10m).toLocaleString("fr-FR", {
        maximumFractionDigits: 1,
      });
      const updatedAt = current.time
        ? new Date(current.time).toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "—";

      weatherInfo.innerHTML = `
        <div class="weather-main">
          <strong class="weather-temp">${temperature}°C</strong>
          <span class="weather-condition">${weatherCodeToLabel(current.weather_code)}</span>
        </div>
        <dl class="weather-meta">
          <div class="weather-meta-item"><dt>Humidité</dt><dd>${humidity}%</dd></div>
          <div class="weather-meta-item"><dt>Vent</dt><dd>${wind} km/h</dd></div>
        </dl>
        <p class="weather-updated">Actualisé à ${updatedAt} · Open-Meteo</p>
      `;
    } catch (error) {
      weatherInfo.innerHTML =
        '<p class="weather-error">La météo est momentanément indisponible. Le paiement reste fonctionnel.</p>';
      console.error("Erreur météo :", error);
    }
  }

  function formatAmount(raw) {
    const digits = raw.replace(/[^\d]/g, "").slice(0, 9);
    if (!digits) return "";
    return Number(digits).toLocaleString("fr-FR");
  }

  function rawAmount() {
    return amountInput.value.replace(/[^\d]/g, "");
  }

  function isAmountValid() {
    const v = Number(rawAmount());
    return v >= 500;
  }

  function isPhoneValid() {
    return /^\d{8}$/.test(phoneInput.value.replace(/\s/g, ""));
  }

  function updateSubmitState() {
    const ok = isAmountValid() && isPhoneValid();
    submitBtn.disabled = !ok;
  }

  amountInput.addEventListener("input", () => {
    amountInput.value = formatAmount(amountInput.value);
    amountError.hidden = amountInput.value === "" || isAmountValid();
    updateSubmitState();
  });

  phoneInput.addEventListener("input", () => {
    phoneInput.value = phoneInput.value.replace(/[^\d\s]/g, "").slice(0, 8);
    phoneError.hidden = phoneInput.value === "" || isPhoneValid();
    updateSubmitState();
  });

  providerBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      provider = btn.dataset.provider;
      providerBtns.forEach((b) => {
        const active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-pressed", String(active));
      });
      const label = PROVIDERS[provider].label;
      providerLabelEl.textContent = label;
      submitLabel.textContent = `Confirmer via ${label}`;
    });
  });

  function generateTxId() {
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    const d = new Date();
    const y = String(d.getFullYear()).slice(2);
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `MP-${y}${m}${day}-${rand}`;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (submitBtn.disabled) return;

    formError.hidden = true;
    submitBtn.disabled = true;
    submitLabel.textContent = "Traitement en cours…";
    liveRegion.textContent = "Paiement en cours de traitement";

    const payload = {
      provider,
      amount: Number(rawAmount()),
      phone: `+257${phoneInput.value.replace(/\s/g, "")}`,
    };

    try {
      const res = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Le paiement a échoué.");
      showReceipt(data.transactionId, payload);
    } catch (err) {
      formError.textContent = err.message || "Erreur inconnue.";
      formError.hidden = false;
      submitBtn.disabled = false;
      submitLabel.textContent = `Confirmer via ${PROVIDERS[provider].label}`;
    }
  });

  function showReceipt(txId, payload) {
    document.getElementById("r-amount").textContent = `FBu ${Number(payload.amount).toLocaleString("fr-FR")}`;
    document.getElementById("r-provider").textContent = PROVIDERS[payload.provider].label;
    document.getElementById("r-phone").textContent = payload.phone;
    document.getElementById("r-txid").textContent = txId;

    const waMessage =
      `Bonjour, je viens de faire un paiement MomoPay.\n` +
      `Référence : ${txId}\n` +
      `Montant : FBu ${Number(payload.amount).toLocaleString("fr-FR")}\n` +
      `Opérateur : ${PROVIDERS[payload.provider].label}`;
    setWhatsAppAction(document.getElementById("r-whatsapp-link"), waMessage);

    form.hidden = true;
    receipt.hidden = false;
    liveRegion.textContent = "Paiement réussi";
  }

  resetBtn.addEventListener("click", () => {
    form.reset();
    provider = "lumicash";
    providerBtns.forEach((b) => {
      const active = b.dataset.provider === "lumicash";
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });
    providerLabelEl.textContent = "Lumicash";
    submitLabel.textContent = "Confirmer via Lumicash";
    amountError.hidden = true;
    phoneError.hidden = true;
    formError.hidden = true;
    submitBtn.disabled = true;

    receipt.hidden = true;
    form.hidden = false;
  });

  window.addEventListener("load", getWeather);
  updateSubmitState();
})();
