(() => {
  const MERCHANT_WHATSAPP = "25761124458"; // format wa.me : indicatif + numéro, sans "+" ni espaces

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

    const waText = encodeURIComponent(
      `Bonjour, je viens de faire un paiement MomoPay.\n` +
        `Référence : ${txId}\n` +
        `Montant : FBu ${Number(payload.amount).toLocaleString("fr-FR")}\n` +
        `Opérateur : ${PROVIDERS[payload.provider].label}`
    );
    document.getElementById("r-whatsapp-link").href = `https://wa.me/${MERCHANT_WHATSAPP}?text=${waText}`;

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

  updateSubmitState();
})();
