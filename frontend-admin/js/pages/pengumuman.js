import { api, formatDate, escapeHtml, showToast, assetUrl } from "../api.js";
import { renderImageField, wireImageField } from "../imageField.js";
import { icon } from "../icons.js";
import { actionCell, detailList, openModal, closeModal } from "../ui.js";

const TYPES = ["Pengumuman", "Jadwal", "Info Pendaftaran", "Kegiatan", "Berita Sanggar"];
let items = [];

async function render(el) {
  el.innerHTML = `
    <div class="a-toolbar"><button class="a-btn a-btn-primary" id="addBtn">${icon("plus")} Tulis Pengumuman</button></div>
    <div class="a-card"><div class="a-table-wrap"><table class="a-table a-compact">
      <thead><tr><th>Judul</th><th>Tipe</th><th>Tanggal</th><th>Aksi</th></tr></thead>
      <tbody id="tbody"><tr><td colspan="4">Memuat...</td></tr></tbody>
    </table></div></div>`;
  document.getElementById("addBtn").addEventListener("click", () => openForm(null));
  await load();
}

async function load() {
  const { announcements } = await api("/announcements");
  items = announcements;
  document.getElementById("tbody").innerHTML = items.length
    ? items
        .map(
          (a) => `<tr>
            <td>${escapeHtml(a.title)}</td><td>${escapeHtml(a.type)}</td><td>${formatDate(a.date)}</td>
            <td>${actionCell(a.id)}</td>
          </tr>`
        )
        .join("")
    : `<tr><td colspan="4" class="a-empty">Belum ada pengumuman.</td></tr>`;
  document.querySelectorAll("[data-detail]").forEach((b) => b.addEventListener("click", () => openDetail(b.getAttribute("data-detail"))));
  document.querySelectorAll("[data-edit]").forEach((b) => b.addEventListener("click", () => openForm(items.find((a) => a.id === b.getAttribute("data-edit")))));
}

function openDetail(id) {
  const a = items.find((x) => x.id === id);
  openModal(`
    <h3>${escapeHtml(a.title)}</h3>
    ${a.image ? `<img class="a-detail-img" src="${assetUrl(a.image)}" onerror="this.style.display='none'" />` : ""}
    ${detailList([
      ["Tipe", escapeHtml(a.type)],
      ["Tanggal", formatDate(a.date)],
      ["Isi pengumuman", escapeHtml(a.body)],
    ])}
    <div class="a-modal-foot"><button class="a-btn a-btn-ghost" id="closeBtn">Tutup</button></div>
  `);
  document.getElementById("closeBtn").addEventListener("click", closeModal);
}

function openForm(a) {
  const fieldId = "pgImg";
  const body = openModal(`
    <h3>${a ? "Edit" : "Tulis"} Pengumuman</h3>
    <form id="pForm">
      <div class="a-field"><label>Judul</label><input name="title" required value="${a ? escapeHtml(a.title) : ""}" /></div>
      <div class="a-field"><label>Tipe</label>
        <select name="type">${TYPES.map((t) => `<option ${a && a.type === t ? "selected" : ""}>${t}</option>`).join("")}</select>
      </div>
      <div class="a-field"><label>Isi pengumuman</label><textarea name="body" rows="5" required>${a ? escapeHtml(a.body) : ""}</textarea></div>
      ${renderImageField(fieldId, "Gambar (opsional)", a ? a.image : "")}
      <div class="a-field-hint" style="margin:-6px 0 12px">Ditampilkan sebagai kartu berita di beranda &amp; halaman Pengumuman, bukan status.</div>
      <div class="a-modal-foot">
        ${a ? `<button type="button" class="a-btn a-btn-danger" id="delBtn">Hapus</button>` : ""}
        <button type="button" class="a-btn a-btn-ghost" id="cancelBtn">Batal</button>
        <button type="submit" class="a-btn a-btn-primary">Simpan</button>
      </div>
    </form>`);
  wireImageField(fieldId);
  document.getElementById("cancelBtn").addEventListener("click", closeModal);
  if (a) {
    document.getElementById("delBtn").addEventListener("click", async () => {
      if (!confirm("Hapus pengumuman ini?")) return;
      try {
        await api(`/announcements/${a.id}`, { method: "DELETE" });
        showToast("Pengumuman dihapus.");
        closeModal();
        load();
      } catch (err) {
        showToast(err.message);
      }
    });
  }
  body.querySelector("#pForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(e.target).entries());
    payload.image = document.getElementById(fieldId).value || null;
    try {
      if (a) await api(`/announcements/${a.id}`, { method: "PATCH", body: payload });
      else await api("/announcements", { method: "POST", body: payload });
      showToast("Pengumuman disimpan.");
      closeModal();
      load();
    } catch (err) {
      showToast(err.message);
    }
  });
}

export default { render };
