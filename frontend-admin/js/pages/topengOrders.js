import { api, formatDate, formatRupiah, escapeHtml, fileUrl, showToast } from "../api.js";

const STATUS_OPTIONS = ["menunggu_konfirmasi_admin", "menunggu_verifikasi", "dikonfirmasi", "diproses", "dikirim", "selesai", "ditolak"];
const STATUS_LABEL = {
  menunggu_konfirmasi_admin: "Menunggu Konfirmasi",
  menunggu_verifikasi: "Menunggu Verifikasi",
  dikonfirmasi: "Dikonfirmasi",
  diproses: "Diproses",
  dikirim: "Dikirim",
  selesai: "Selesai",
  ditolak: "Ditolak",
};
function tone(s) {
  if (["dikonfirmasi", "selesai", "dikirim"].includes(s)) return "ok";
  if (s === "ditolak") return "bad";
  return "wait";
}

let allOrders = [];
let filterStatus = "";

async function render(el) {
  el.innerHTML = `
    <div class="a-toolbar">
      <div class="a-filters">
        <select class="a-select" id="fStatus"><option value="">Semua Status</option>${STATUS_OPTIONS.map((s) => `<option value="${s}">${STATUS_LABEL[s]}</option>`).join("")}</select>
      </div>
    </div>
    <div class="a-card"><div class="a-table-wrap"><table class="a-table" id="table"><tbody><tr><td>Memuat...</td></tr></tbody></table></div></div>
    <div class="a-modal-overlay" id="detailModal"><div class="a-modal" id="detailModalBody"></div></div>
  `;
  const { orders } = await api("/topeng/admin/orders");
  allOrders = orders;
  document.getElementById("fStatus").addEventListener("change", (e) => {
    filterStatus = e.target.value;
    paint();
  });
  document.getElementById("detailModal").addEventListener("click", (e) => {
    if (e.target.id === "detailModal") e.target.classList.remove("open");
  });
  paint();
}

function paint() {
  const rows = allOrders.filter((o) => !filterStatus || o.status === filterStatus);
  document.getElementById("table").innerHTML = `
    <thead><tr><th>Pembeli</th><th>Topeng</th><th>Total</th><th>Custom</th><th>Status</th><th>Aksi</th></tr></thead>
    <tbody>${
      rows.length
        ? rows
            .map(
              (o) => `<tr>
                <td>${escapeHtml(o.userName)}<br/><span style="font-size:0.72rem;color:var(--ink-soft)">${escapeHtml(o.buyerPhone || "-")}</span></td>
                <td>${escapeHtml(o.topengName)} x${o.qty}</td>
                <td>${formatRupiah(o.total)}</td>
                <td>${o.customName || o.customDesign ? "✅" : "-"}</td>
                <td><span class="a-badge ${tone(o.status)}">${STATUS_LABEL[o.status] || o.status}</span></td>
                <td><button class="a-btn a-btn-outline a-btn-sm" data-detail="${o.id}">Detail</button></td>
              </tr>`
            )
            .join("")
        : `<tr><td colspan="6" class="a-empty">Tidak ada pesanan yang cocok dengan filter.</td></tr>`
    }</tbody>`;
  document.querySelectorAll("[data-detail]").forEach((btn) => btn.addEventListener("click", () => openDetail(btn.getAttribute("data-detail"))));
}

function openDetail(id) {
  const o = allOrders.find((x) => x.id === id);
  const modal = document.getElementById("detailModal");
  document.getElementById("detailModalBody").innerHTML = `
    <h3>${escapeHtml(o.topengName)} x${o.qty}</h3>
    <div class="a-field-hint" style="margin-bottom:10px">${escapeHtml(o.userName)} · ${escapeHtml(o.buyerPhone || "-")} · ${formatDate(o.createdAt)}</div>
    ${o.customName ? `<div style="font-size:0.85rem">✏️ Nama custom: <strong>${escapeHtml(o.customName)}</strong></div>` : ""}
    ${o.customDesign ? `<div style="font-size:0.85rem;margin-top:4px">🎨 Desain custom: ${escapeHtml(o.customDesign)}</div>` : ""}
    ${o.message ? `<div style="font-size:0.85rem;margin-top:4px">📝 Catatan: ${escapeHtml(o.message)}</div>` : ""}
    <div style="font-weight:700;margin-top:8px">Total: ${formatRupiah(o.total)}</div>
    ${o.paymentMethod ? `<div style="font-size:0.85rem">💳 Metode: ${escapeHtml(o.paymentMethod)}</div>` : ""}
    ${o.proofFile ? `<a href="${fileUrl(o.proofFile)}" target="_blank" class="a-btn a-btn-outline a-btn-sm" style="margin-top:8px">📎 Lihat Bukti Pembayaran</a>` : ""}

    <div style="margin-top:14px">
      <label style="font-size:0.78rem;font-weight:700;color:var(--wood-900)">Riwayat Chat</label>
      <div class="a-chatlog" style="margin-top:6px">
        ${o.chatLog.map((m) => `<div class="bub ${m.from}">${escapeHtml(m.text)}</div>`).join("")}
      </div>
      <div style="display:flex;gap:8px">
        <input class="a-field" id="adminReply" placeholder="Balas pembeli..." style="flex:1;border:1.5px solid var(--line);border-radius:9px;padding:9px 11px" />
        <button class="a-btn a-btn-outline a-btn-sm" id="sendReplyBtn">Kirim</button>
      </div>
    </div>

    <div class="a-field" style="margin-top:14px">
      <label>Ubah status</label>
      <select class="a-select" id="statusSelect" style="width:100%">${STATUS_OPTIONS.map((s) => `<option value="${s}" ${s === o.status ? "selected" : ""}>${STATUS_LABEL[s]}</option>`).join("")}</select>
    </div>
    <div style="display:flex;gap:8px;margin-top:14px">
      <button class="a-btn a-btn-ghost" id="closeDetail" style="flex:1;justify-content:center">Tutup</button>
      <button class="a-btn a-btn-primary" id="saveStatus" style="flex:1;justify-content:center">Simpan</button>
    </div>
  `;
  modal.classList.add("open");
  document.getElementById("closeDetail").addEventListener("click", () => modal.classList.remove("open"));
  document.getElementById("sendReplyBtn").addEventListener("click", async () => {
    const text = document.getElementById("adminReply").value.trim();
    if (!text) return;
    try {
      await api(`/topeng/orders/${id}/message`, { method: "POST", body: { text } });
      const { order } = await api(`/topeng/orders/${id}`);
      const idx = allOrders.findIndex((x) => x.id === id);
      allOrders[idx] = order;
      openDetail(id);
    } catch (err) {
      showToast(err.message);
    }
  });
  document.getElementById("saveStatus").addEventListener("click", async () => {
    const status = document.getElementById("statusSelect").value;
    try {
      await api(`/topeng/admin/orders/${id}/status`, { method: "PATCH", body: { status } });
      showToast("Status pesanan diperbarui.");
      modal.classList.remove("open");
      render(document.getElementById("aContent"));
    } catch (err) {
      showToast(err.message);
    }
  });
}

export default { render };
