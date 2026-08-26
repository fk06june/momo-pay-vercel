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
    "&hourly=temperature_2m,weather_code,precipitation_probability" +
    "&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max" +
    "&forecast_days=3&timezone=Africa%2FBujumbura";

  function weatherCodeToLabel(code) {
    if (code === 0) return "Beau";
    if ([1, 2, 3].includes(code)) return "Partiellement nuageux";
    if ([45, 48].includes(code)) return "Brouillard";
    if ([51, 53, 55, 56, 57].includes(code)) return "Bruine";
    if ([61, 63, 65, 66, 67].includes(code)) return "Pluie";
    if ([71, 73, 75, 77].includes(code)) return "Neige";
    if ([80, 81, 82].includes(code)) return "Averses";
    if ([95, 96, 99].includes(code)) return "Orage";
    return "Conditions variables";
  }

  function iconSvg(type) {
    const paths = {
      sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"/>',
      partly: '<circle cx="15.5" cy="8.5" r="3.4"/><path d="M15.5 3.5v1.2M15.5 12.3v1.2M10.5 8.5h1.2M19.3 8.5h1.2M12 5l.85.85M18.15 11.15L19 12M8.2 16.5h8.4a3.2 3.2 0 0 0 .2-6.4 4.7 4.7 0 0 0-8.95 1.7A2.35 2.35 0 0 0 8.2 16.5Z"/>',
      cloud: '<path d="M6.6 17.2h9.8a3.5 3.5 0 0 0 .2-7 5.3 5.3 0 0 0-10.1 1.9 2.55 2.55 0 0 0 .1 5.1Z"/>',
      rain: '<path d="M6.6 13.2h9.8a3.5 3.5 0 0 0 .2-7 5.3 5.3 0 0 0-10.1 1.9 2.55 2.55 0 0 0 .1 5.1Z"/><path d="m8 17-.8 2M12 17l-.8 2M16 17l-.8 2"/>',
      storm: '<path d="M6.6 13.2h9.8a3.5 3.5 0 0 0 .2-7 5.3 5.3 0 0 0-10.1 1.9 2.55 2.55 0 0 0 .1 5.1Z"/><path d="m13 14-2 4h2l-1 3 4-5h-2l2-2"/>',
      drop: '<path d="M12 3.4S6.8 9.2 6.8 13.1a5.2 5.2 0 0 0 10.4 0C17.2 9.2 12 3.4 12 3.4Z"/>'
    };
    const fill = type === "sun" || type === "partly" ? "currentColor" : "none";
    const stroke = type === "sun" || type === "partly" ? "currentColor" : "currentColor";
    return `<svg class="weather-icon weather-icon-${type}" viewBox="0 0 24 24" fill="${fill}" stroke="${stroke}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[type] || paths.cloud}</svg>`;
  }

  function weatherCodeToIcon(code) {
    if (code === 0) return iconSvg("sun");
    if ([1, 2, 3].includes(code)) return iconSvg("partly");
    if ([45, 48].includes(code)) return iconSvg("cloud");
    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return iconSvg("rain");
    if ([95, 96, 99].includes(code)) return iconSvg("storm");
    return iconSvg("cloud");
  }

  function formatWeatherDay(dateValue, index) {
    if (index === 0) return "Aujourd’hui";
    return new Date(`${dateValue}T12:00:00`).toLocaleDateString("fr-FR", { weekday: "long" });
  }

  function getHourlyIndexes(hourly) {
    const now = new Date();
    const start = hourly.time.findIndex((time) => new Date(time) >= now);
    return Array.from({ length: 6 }, (_, offset) => Math.max(0, (start < 0 ? 0 : start) + offset));
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
      const hourly = data.hourly || { time: [], temperature_2m: [], weather_code: [], precipitation_probability: [] };
      const daily = data.daily || { time: [], temperature_2m_max: [], temperature_2m_min: [], weather_code: [], uv_index_max: [] };
      const hourlyIndexes = getHourlyIndexes(hourly);
      const hourlyMarkup = hourlyIndexes.map((index) => {
        const time = hourly.time[index];
        const hour = time ? new Date(time).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "—";
        const temp = Number(hourly.temperature_2m[index] ?? current.temperature_2m).toLocaleString("fr-FR", { maximumFractionDigits: 0 });
        const rain = Number(hourly.precipitation_probability[index] ?? 0).toLocaleString("fr-FR");
        return `<div class="weather-hour"><span class="weather-hour-time">${hour}</span><span class="weather-hour-icon" aria-hidden="true">${weatherCodeToIcon(hourly.weather_code[index])}</span><strong class="weather-hour-temp">${temp}°</strong><span class="weather-hour-rain">${iconSvg("drop")} ${rain}%</span></div>`;
      }).join("");
      const dailyMarkup = daily.time.slice(0, 3).map((date, index) => {
        const max = Number(daily.temperature_2m_max[index] ?? current.temperature_2m).toLocaleString("fr-FR", { maximumFractionDigits: 0 });
        const min = Number(daily.temperature_2m_min[index] ?? current.temperature_2m).toLocaleString("fr-FR", { maximumFractionDigits: 0 });
        return `<div class="weather-daily-row"><span class="weather-day">${formatWeatherDay(date, index)}</span><span class="weather-day-icon" aria-hidden="true">${weatherCodeToIcon(daily.weather_code[index])}</span><span class="weather-day-temp">${max}° / ${min}°</span></div>`;
      }).join("");
      const uv = Number(daily.uv_index_max?.[0] ?? 0).toLocaleString("fr-FR", { maximumFractionDigits: 0 });

      weatherInfo.innerHTML = `
        <div class="weather-hero">
          <div class="weather-main"><strong class="weather-temp">${temperature}°</strong><span class="weather-condition">${weatherCodeToLabel(current.weather_code)}</span></div>
          <div class="weather-art" aria-hidden="true"><span class="weather-sun"></span><span class="weather-cloud"></span></div>
          <div class="weather-summary-row"><span>${temperature}° / ${Number(daily.temperature_2m_min?.[0] ?? current.temperature_2m).toLocaleString("fr-FR", { maximumFractionDigits: 0 })}°</span><strong>Ressenti ${temperature}°</strong></div>
        </div>
        <div class="weather-panel">
          <div class="weather-hourly-head"><p class="weather-panel-title">${weatherCodeToLabel(current.weather_code)}. Prévisions locales</p><span>${humidity}% humidité · ${wind} km/h</span></div>
          <div class="weather-hourly">${hourlyMarkup}</div>
        </div>
        <div class="weather-uv"><div class="weather-uv-label"><span class="weather-uv-heading">${iconSvg("sun")} Protégez votre peau</span><strong>Indice UV du jour</strong><span class="weather-uv-bar"><span></span></span></div><strong class="weather-uv-score">${uv}</strong></div>
        <div class="weather-panel weather-daily"><div class="weather-hourly-head"><p class="weather-panel-title">Prévisions</p><span>3 jours</span></div>${dailyMarkup}</div>
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
