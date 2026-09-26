import { api, showToast, formatRupiah, fileUrl, escapeHtml } from "./api.js";

// kind: "booking" | "topeng"  (decides which endpoints to call)
// id: booking id or topeng order id
// amount: nominal to display
// existingProof / existingMethod: if already paid, just show the receipt
export function renderPaymentBlock({ kind, id, amount, existingProof, existingMethod }) {
  const base = kind === "topeng" ? `/topeng/orders/${id}` : `/bookings/${id}`;
  const wrapId = `pay-${kind}-${id}`;

  if (existingProof) {
    return `
      <div class="card card-pad payment-box" id="${wrapId}">
        <div class="pay-done">
          <div class="pay-done-icon">✅</div>
          <div>
            <strong>Bukti pembayaran terkirim</strong>
            <div class="field-hint">Metode: ${existingMethod || "-"} · Menunggu verifikasi admin.</div>
          </div>
        </div>
        <a href="${fileUrl(existingProof)}" target="_blank" class="btn btn-outline btn-sm" style="margin-top:10px">Lihat bukti yang diunggah</a>
      </div>`;
  }

  setTimeout(() => initPaymentBlock({ kind, id, amount, base, wrapId }), 0);

  return `
    <div class="card card-pad payment-box" id="${wrapId}">
      <div class="field">
        <label>Pilih metode pembayaran</label>
        <div class="pill-choice pay-methods">
          <label><input type="radio" name="pm-${wrapId}" value="qris" checked /><span>📷 QRIS</span></label>
          <label><input type="radio" name="pm-${wrapId}" value="transfer" /><span>🏦 Transfer Bank</span></label>
          <label><input type="radio" name="pm-${wrapId}" value="cash" /><span>💵 Tunai</span></label>
        </div>
      </div>
      <div id="${wrapId}-area"></div>
    </div>`;
}

async function initPaymentBlock({ kind, id, amount, base, wrapId }) {
  const wrap = document.getElementById(wrapId);
  if (!wrap) return;
  const radios = wrap.querySelectorAll(`input[name="pm-${wrapId}"]`);
  radios.forEach((r) => r.addEventListener("change", () => renderMethodArea()));
  renderMethodArea();

  async function renderMethodArea() {
    const method = wrap.querySelector(`input[name="pm-${wrapId}"]:checked`).value;
    const area = document.getElementById(`${wrapId}-area`);
    if (method === "cash") {
      area.innerHTML = `
        <div class="field-hint" style="margin:8px 0 12px">Bayar tunai langsung di lokasi / saat topeng diambil-diantar. Kamu tetap bisa unggah foto bukti (mis. kuitansi) di bawah ini — opsional.</div>
        ${proofUploadHtml(wrapId, false)}`;
      wireProofUpload({ wrapId, base, method });
      return;
    }

    // QRIS / transfer both require phone verification first
    let status;
    try {
      status = await api("/payments/settings", { auth: true });
    } catch (err) {
      area.innerHTML = `<div class="empty-state">Gagal memuat info pembayaran.</div>`;
      return;
    }

    if (!status.phoneVerified) {
      area.innerHTML = phoneVerifyHtml(wrapId, status.verifiedPhone);
      wirePhoneVerify(wrapId, renderMethodArea);
      return;
    }

    if (method === "qris") {
      area.innerHTML = `<div class="qr-box" style="margin-top:10px">Memuat QRIS...</div>`;
      try {
        const { qris, amount: amt } = await api(`${base}/qris`, { auth: true });
        area.innerHTML = `
          <div class="qr-box"><img src="${qris}"/><div style="font-weight:700">${formatRupiah(amt)}</div><div class="field-hint">Scan dengan aplikasi e-wallet/mobile banking apapun. QRIS simulasi untuk keperluan demo.</div></div>
          ${proofUploadHtml(wrapId, true)}`;
        wireProofUpload({ wrapId, base, method });
      } catch (err) {
        area.innerHTML = `<div class="empty-state">${escapeHtml(err.message)}</div>`;
      }
    } else if (method === "transfer") {
      area.innerHTML = `<div class="qr-box" style="margin-top:10px">Memuat info rekening...</div>`;
      try {
        const { bank, amount: amt } = await api(`${base}/transfer`, { auth: true });
        area.innerHTML = `
          <div class="transfer-box">
            <div class="tb-row"><span>Bank</span><strong>${escapeHtml(bank.bankName)}</strong></div>
            <div class="tb-row"><span>No. Rekening</span><strong>${escapeHtml(bank.accountNumber)}</strong></div>
            <div class="tb-row"><span>Atas Nama</span><strong>${escapeHtml(bank.accountName)}</strong></div>
            <div class="tb-row"><span>Nominal</span><strong>${formatRupiah(amt)}</strong></div>
          </div>
          ${proofUploadHtml(wrapId, true)}`;
        wireProofUpload({ wrapId, base, method });
      } catch (err) {
        area.innerHTML = `<div class="empty-state">${escapeHtml(err.message)}</div>`;
      }
    }
  }
}

function phoneVerifyHtml(wrapId, existingPhone) {
  return `
    <div class="phone-verify-box">
      <div class="field-hint" style="margin-bottom:10px">🔒 Verifikasi nomor HP kamu dulu untuk melihat detail QRIS/rekening tujuan.</div>
      <div id="${wrapId}-pv-step1">
        <div class="field"><label>Nomor WhatsApp</label><input id="${wrapId}-pv-phone" placeholder="08xxxxxxxxxx" value="${existingPhone || ""}" /></div>
        <button class="btn btn-primary btn-sm" id="${wrapId}-pv-send">Kirim Kode Verifikasi</button>
      </div>
      <div id="${wrapId}-pv-step2" style="display:none;margin-top:10px">
        <div class="field"><label>Kode verifikasi (6 digit)</label><input id="${wrapId}-pv-code" maxlength="6" placeholder="123456" /></div>
        <button class="btn btn-primary btn-sm" id="${wrapId}-pv-verify">Verifikasi</button>
        <button class="btn btn-ghost btn-sm" id="${wrapId}-pv-resend" style="margin-left:6px">Kirim ulang</button>
      </div>
    </div>`;
}

function wirePhoneVerify(wrapId, onVerified) {
  const sendBtn = document.getElementById(`${wrapId}-pv-send`);
  const resendBtn = document.getElementById(`${wrapId}-pv-resend`);
  const verifyBtn = document.getElementById(`${wrapId}-pv-verify`);

  async function sendCode() {
    const phone = document.getElementById(`${wrapId}-pv-phone`).value.trim();
    if (!phone) return showToast("Isi nomor HP dulu.");
    try {
      const res = await api("/payments/phone/send-otp", { method: "POST", auth: true, body: { phone } });
      document.getElementById(`${wrapId}-pv-step1`).style.display = "none";
      document.getElementById(`${wrapId}-pv-step2`).style.display = "block";
      showToast(res.devCode ? `Kode verifikasi (demo): ${res.devCode}` : res.message);
    } catch (err) {
      showToast(err.message);
    }
  }
  sendBtn.addEventListener("click", sendCode);
  resendBtn.addEventListener("click", sendCode);
  verifyBtn.addEventListener("click", async () => {
    const phone = document.getElementById(`${wrapId}-pv-phone`).value.trim();
    const code = document.getElementById(`${wrapId}-pv-code`).value.trim();
    if (!code) return showToast("Masukkan kode verifikasi.");
    try {
      await api("/payments/phone/verify-otp", { method: "POST", auth: true, body: { phone, code } });
      showToast("Nomor HP terverifikasi!");
      onVerified();
    } catch (err) {
      showToast(err.message);
    }
  });
}

function proofUploadHtml(wrapId, required) {
  return `
    <div class="field" style="margin-top:12px">
      <label>Unggah bukti pembayaran ${required ? "" : "(opsional)"}</label>
      <input type="file" id="${wrapId}-proof" accept="image/*,.pdf" />
    </div>
    <button class="btn btn-primary" id="${wrapId}-proof-btn">Unggah Bukti</button>`;
}

function wireProofUpload({ wrapId, base, method }) {
  const btn = document.getElementById(`${wrapId}-proof-btn`);
  if (!btn) return;
  btn.addEventListener("click", async () => {
    const fileInput = document.getElementById(`${wrapId}-proof`);
    if (method !== "cash" && !fileInput.files.length) return showToast("Pilih file bukti pembayaran dulu.");
    const fd = new FormData();
    if (fileInput.files.length) fd.append("proof", fileInput.files[0]);
    fd.append("paymentMethod", method);
    try {
      if (fileInput.files.length) {
        await api(`${base}/proof`, { method: "POST", auth: true, isForm: true, body: fd });
        showToast("Bukti pembayaran diunggah!");
      } else {
        showToast("Metode tunai dicatat. Bayar langsung di lokasi ya.");
      }
      window.dispatchEvent(new CustomEvent("payment:done"));
    } catch (err) {
      showToast(err.message);
    }
  });
}
