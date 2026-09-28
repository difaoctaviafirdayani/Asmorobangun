import { api, showToast, formatRupiah, fileUrl, escapeHtml } from "./api.js";
import { icon } from "./icons.js";

// Alur pembayaran (sama untuk booking layanan & pesanan topeng):
//   QRIS          -> langsung tampil gambar QRIS, lalu unggah bukti pembayaran
//   Transfer Bank -> langsung tampil nomor rekening, lalu unggah bukti pembayaran
//   Tunai         -> cukup pilih "Bayar Tunai", tanpa bukti pembayaran & tanpa verifikasi apa pun
//
// kind: "booking" | "topeng"
// methods: pengaturan metode pembayaran dari admin (facility.paymentMethods), boleh kosong
export function renderPaymentBlock({ kind, id, amount, existingProof, existingMethod, methods = {} }) {
  const base = kind === "topeng" ? `/topeng/orders/${id}` : `/bookings/${id}`;
  const wrapId = `pay-${kind}-${id}`;

  if (existingProof) {
    return `
      <div class="card card-pad payment-box" id="${wrapId}">
        <div class="pay-done">
          <div class="pay-done-icon">${icon("check")}</div>
          <div>
            <strong>Bukti pembayaran terkirim</strong>
            <div class="field-hint">Metode: ${methodLabel(existingMethod)} · Menunggu verifikasi admin.</div>
          </div>
        </div>
        <a href="${fileUrl(existingProof)}" target="_blank" class="btn btn-outline btn-sm" style="margin-top:10px">Lihat bukti yang diunggah</a>
      </div>`;
  }

  if (existingMethod === "cash") {
    setTimeout(() => wireChangeMethod({ id, amount, base, wrapId, methods }), 0);
    return `
      <div class="card card-pad payment-box" id="${wrapId}">
        <div class="pay-done">
          <div class="pay-done-icon">${icon("cash")}</div>
          <div>
            <strong>Pembayaran tunai dicatat</strong>
            <div class="field-hint">Silakan bayar langsung di lokasi. Tidak perlu unggah bukti pembayaran.</div>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" id="${wrapId}-change" style="margin-top:10px">Ganti metode pembayaran</button>
      </div>`;
  }

  return pickerHtml({ id, amount, base, wrapId, methods });
}

function methodLabel(m) {
  return { qris: "QRIS", transfer: "Transfer Bank", cash: "Tunai" }[m] || "-";
}

function pickerHtml({ id, amount, base, wrapId, methods }) {
  const isOn = (m) => !methods[m] || methods[m].enabled !== false;
  const all = [
    { key: "qris", label: "QRIS", ic: "qr" },
    { key: "transfer", label: "Transfer Bank", ic: "bank" },
    { key: "cash", label: "Tunai", ic: "cash" },
  ].filter((m) => isOn(m.key));

  if (!all.length) {
    return `<div class="card card-pad payment-box" id="${wrapId}"><div class="empty-state">Belum ada metode pembayaran yang aktif. Silakan hubungi admin sanggar.</div></div>`;
  }

  setTimeout(() => initPaymentBlock({ id, amount, base, wrapId, methods }), 0);

  return `
    <div class="card card-pad payment-box" id="${wrapId}">
      <div class="field">
        <label>Pilih metode pembayaran</label>
        <div class="pill-choice pay-methods">
          ${all
            .map(
              (m, i) =>
                `<label><input type="radio" name="pm-${wrapId}" value="${m.key}" ${i === 0 ? "checked" : ""} /><span class="pay-method-label">${icon(m.ic)} ${m.label}</span></label>`
            )
            .join("")}
        </div>
      </div>
      <div id="${wrapId}-area"></div>
    </div>`;
}

// Dari keadaan "tunai sudah dipilih" kembali ke pilihan metode
function wireChangeMethod({ id, amount, base, wrapId, methods }) {
  const btn = document.getElementById(`${wrapId}-change`);
  if (!btn) return;
  btn.addEventListener("click", () => {
    const wrap = document.getElementById(wrapId);
    if (wrap) wrap.outerHTML = pickerHtml({ id, amount, base, wrapId, methods });
  });
}

async function initPaymentBlock({ id, amount, base, wrapId, methods }) {
  const wrap = document.getElementById(wrapId);
  if (!wrap) return;
  let token = 0; // supaya balasan lama tidak menimpa pilihan metode yang lebih baru
  wrap.querySelectorAll(`input[name="pm-${wrapId}"]`).forEach((r) => r.addEventListener("change", () => renderMethodArea()));
  renderMethodArea();

  async function renderMethodArea() {
    const my = ++token;
    const method = wrap.querySelector(`input[name="pm-${wrapId}"]:checked`).value;
    const area = document.getElementById(`${wrapId}-area`);
    if (!area) return;

    if (method === "cash") {
      const note = methods.cash && methods.cash.note ? `<strong>Catatan:</strong> ${escapeHtml(methods.cash.note)}<br/>` : "";
      area.innerHTML = `
        <div class="pay-cash-box">
          <p>${note}Bayar tunai langsung di lokasi sanggar. Tidak perlu unggah bukti pembayaran.</p>
          <button class="btn btn-primary" id="${wrapId}-cash-btn">Pilih Bayar Tunai</button>
        </div>`;
      wireCash({ wrapId, base });
      return;
    }

    area.innerHTML = `<div class="qr-box" style="margin-top:10px">${method === "qris" ? "Memuat QRIS..." : "Memuat info rekening..."}</div>`;

    if (method === "qris") {
      try {
        const { qris, amount: amt } = await api(`${base}/qris`, { auth: true });
        if (my !== token) return;
        const src = qris.startsWith("/uploads") ? fileUrl(qris) : qris;
        area.innerHTML = `
          <div class="qr-box"><img src="${src}" alt="QRIS pembayaran"/>${amt ? `<div style="font-weight:700">${formatRupiah(amt)}</div>` : ""}<div class="field-hint">Scan dengan aplikasi e-wallet/mobile banking apa pun, lalu unggah bukti pembayaran.</div></div>
          ${proofUploadHtml(wrapId)}`;
        wireProofUpload({ wrapId, base, method });
      } catch (err) {
        if (my === token) area.innerHTML = `<div class="empty-state">${escapeHtml(err.message)}</div>`;
      }
    } else if (method === "transfer") {
      try {
        const { bank, amount: amt, note } = await api(`${base}/transfer`, { auth: true });
        if (my !== token) return;
        const rows = note
          ? `<div class="tb-row"><span>Info transfer</span><strong>${escapeHtml(note)}</strong></div>`
          : `<div class="tb-row"><span>Bank</span><strong>${escapeHtml(bank.bankName)}</strong></div>
             <div class="tb-row"><span>No. Rekening</span><strong>${escapeHtml(bank.accountNumber)}</strong></div>
             <div class="tb-row"><span>Atas Nama</span><strong>${escapeHtml(bank.accountName)}</strong></div>`;
        area.innerHTML = `
          <div class="transfer-box">
            ${rows}
            ${amt ? `<div class="tb-row"><span>Nominal</span><strong>${formatRupiah(amt)}</strong></div>` : ""}
          </div>
          ${proofUploadHtml(wrapId)}`;
        wireProofUpload({ wrapId, base, method });
      } catch (err) {
        if (my === token) area.innerHTML = `<div class="empty-state">${escapeHtml(err.message)}</div>`;
      }
    }
  }
}

function wireCash({ wrapId, base }) {
  const btn = document.getElementById(`${wrapId}-cash-btn`);
  if (!btn) return;
  btn.addEventListener("click", async () => {
    btn.disabled = true;
    try {
      await api(`${base}/cash`, { method: "POST", auth: true });
      showToast("Pembayaran tunai dicatat. Bayar langsung di lokasi ya.");
      window.dispatchEvent(new CustomEvent("payment:done", { detail: { method: "cash" } }));
    } catch (err) {
      btn.disabled = false;
      showToast(err.message);
    }
  });
}

function proofUploadHtml(wrapId) {
  return `
    <div class="field" style="margin-top:12px">
      <label>Unggah bukti pembayaran</label>
      <input type="file" id="${wrapId}-proof" accept="image/*,.pdf" />
    </div>
    <button class="btn btn-primary" id="${wrapId}-proof-btn">Unggah Bukti</button>`;
}

function wireProofUpload({ wrapId, base, method }) {
  const btn = document.getElementById(`${wrapId}-proof-btn`);
  if (!btn) return;
  btn.addEventListener("click", async () => {
    const fileInput = document.getElementById(`${wrapId}-proof`);
    if (!fileInput.files.length) return showToast("Pilih file bukti pembayaran dulu.");
    const fd = new FormData();
    fd.append("proof", fileInput.files[0]);
    fd.append("paymentMethod", method);
    btn.disabled = true;
    try {
      await api(`${base}/proof`, { method: "POST", auth: true, isForm: true, body: fd });
      showToast("Bukti pembayaran diunggah!");
      window.dispatchEvent(new CustomEvent("payment:done", { detail: { method } }));
    } catch (err) {
      btn.disabled = false;
      showToast(err.message);
    }
  });
}
