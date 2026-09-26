import { api, formatDate, formatRupiah, escapeHtml, assetUrl, showToast, fileUrl } from "../api.js";

const STATUS_OPTIONS = [
  "menunggu_pembayaran",
  "menunggu_verifikasi",
  "menunggu_kedatangan",
  "menunggu_konfirmasi_admin",
  "dikonfirmasi",
  "ditolak",
  "selesai",
];
const STATUS_LABEL = {
  menunggu_pembayaran: "Menunggu Pembayaran",
  menunggu_verifikasi: "Menunggu Verifikasi",
  menunggu_kedatangan: "Menunggu Kedatangan",
  menunggu_konfirmasi_admin: "Menunggu Konfirmasi",
  dikonfirmasi: "Dikonfirmasi",
  ditolak: "Ditolak",
  selesai: "Selesai",
};
function tone(s) {
  if (["dikonfirmasi", "selesai"].includes(s)) return "ok";
  if (s === "ditolak") return "bad";
  return "wait";
}

let allBookings = [];
let filterFacility = "";
let filterStatus = "";

async function render(el) {
  el.innerHTML = `
    <div class="a-toolbar">
      <div class="a-filters">
        <select class="a-select" id="fFacility"><option value="">Semua Layanan</option></select>
        <select class="a-select" id="fStatus"><option value="">Semua Status</option>${STATUS_OPTIONS.map((s) => `<option value="${s}">${STATUS_LABEL[s]}</option>`).join("")}</select>
      </div>
    </div>
    <div class="a-card"><div class="a-table-wrap"><table class="a-table" id="table"><tbody><tr><td>Memuat...</td></tr></tbody></table></div></div>

    <div class="a-modal-overlay" id="detailModal">
      <div class="a-modal" id="detailModalBody"></div>
    </div>
  `;

  const { bookings } = await api("/bookings");
  allBookings = bookings;

  const facilities = [...new Set(bookings.map((b) => b.facilityName))];
  document.getElementById("fFacility").innerHTML += facilities.map((f) => `<option value="${escapeHtml(f)}">${escapeHtml(f)}</option>`).join("");

  document.getElementById("fFacility").addEventListener("change", (e) => {
    filterFacility = e.target.value;
    paint();
  });
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
  const rows = allBookings.filter((b) => (!filterFacility || b.facilityName === filterFacility) && (!filterStatus || b.status === filterStatus));
  document.getElementById("table").innerHTML = `
    <thead><tr><th>Nama</th><th>Layanan</th><th>Tanggal</th><th>Nominal</th><th>Status</th><th>Aksi</th></tr></thead>
    <tbody>${
      rows.length
        ? rows
            .map(
              (b) => `<tr>
                <td>${escapeHtml(b.userName)}<br/><span style="font-size:0.72rem;color:var(--ink-soft)">${escapeHtml(b.userEmail)}</span></td>
                <td>${escapeHtml(b.facilityName)}</td>
                <td>${b.date ? formatDate(b.date) : "-"}</td>
                <td>${b.amount ? formatRupiah(b.amount) : "-"}</td>
                <td><span class="a-badge ${tone(b.status)}">${STATUS_LABEL[b.status] || b.status}</span></td>
                <td><button class="a-btn a-btn-outline a-btn-sm" data-detail="${b.id}">Detail</button></td>
              </tr>`
            )
            .join("")
        : `<tr><td colspan="6" class="a-empty">Tidak ada data yang cocok dengan filter.</td></tr>`
    }</tbody>`;
  document.querySelectorAll("[data-detail]").forEach((btn) => btn.addEventListener("click", () => openDetail(btn.getAttribute("data-detail"))));
}

function openDetail(id) {
  const b = allBookings.find((x) => x.id === id);
  const modal = document.getElementById("detailModal");
  document.getElementById("detailModalBody").innerHTML = `
    <h3>${escapeHtml(b.facilityName)}</h3>
    <div class="a-field-hint" style="margin-bottom:12px">${escapeHtml(b.userName)} · ${escapeHtml(b.userEmail)}</div>
    <div style="font-size:0.85rem;line-height:1.8">
      ${b.date ? `<div>📅 Tanggal: ${formatDate(b.date)}</div>` : ""}
      ${b.eventType ? `<div>🎪 Jenis acara: ${escapeHtml(b.eventType)}</div>` : ""}
      ${b.location ? `<div>📍 Lokasi: ${escapeHtml(b.location)}</div>` : ""}
      ${b.guestCount ? `<div>👥 Jumlah tamu: ${escapeHtml(String(b.guestCount))}</div>` : ""}
      ${b.notes ? `<div>📝 Catatan: ${escapeHtml(b.notes)}</div>` : ""}
      ${b.amount ? `<div>💰 Nominal: ${formatRupiah(b.amount)}</div>` : ""}
      ${b.paymentMethod ? `<div>💳 Metode: ${escapeHtml(b.paymentMethod)}</div>` : ""}
    </div>
    ${b.proofFile ? `<a href="${fileUrl(b.proofFile)}" target="_blank" class="a-btn a-btn-outline a-btn-sm" style="margin-top:10px">📎 Lihat Bukti Pembayaran</a>` : ""}
    <div class="a-field" style="margin-top:16px">
      <label>Ubah status</label>
      <select class="a-select" id="statusSelect" style="width:100%">${STATUS_OPTIONS.map((s) => `<option value="${s}" ${s === b.status ? "selected" : ""}>${STATUS_LABEL[s]}</option>`).join("")}</select>
    </div>
    <div style="display:flex;gap:8px;margin-top:14px">
      <button class="a-btn a-btn-ghost" id="closeDetail" style="flex:1;justify-content:center">Tutup</button>
      <button class="a-btn a-btn-primary" id="saveStatus" style="flex:1;justify-content:center">Simpan</button>
    </div>
  `;
  modal.classList.add("open");
  document.getElementById("closeDetail").addEventListener("click", () => modal.classList.remove("open"));
  document.getElementById("saveStatus").addEventListener("click", async () => {
    const status = document.getElementById("statusSelect").value;
    try {
      await api(`/bookings/${id}/status`, { method: "PATCH", body: { status } });
      showToast("Status diperbarui.");
      modal.classList.remove("open");
      render(document.getElementById("aContent"));
    } catch (err) {
      showToast(err.message);
    }
  });
}

export default { render };
