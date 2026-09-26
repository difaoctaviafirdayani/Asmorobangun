import { api, formatDate, escapeHtml, showToast } from "../api.js";
import { renderMediaPickerField, wireMediaPickerField } from "../mediaPicker.js";

const TYPES = ["Pengumuman", "Jadwal", "Info Pendaftaran", "Kegiatan", "Berita Sanggar"];

async function render(el) {
  el.innerHTML = `
    <div class="a-toolbar"><button class="a-btn a-btn-primary" id="addBtn">➕ Tulis Pengumuman</button></div>
    <div class="a-card"><div class="a-table-wrap"><table class="a-table"><thead><tr><th>Judul</th><th>Tipe</th><th>Tanggal</th><th>Aksi</th></tr></thead><tbody id="tbody"><tr><td colspan="4">Memuat...</td></tr></tbody></table></div></div>
    <div class="a-modal-overlay" id="formModal"><div class="a-modal" id="formModalBody"></div></div>
  `;
  document.getElementById("addBtn").addEventListener("click", () => openForm(null));
  document.getElementById("formModal").addEventListener("click", (e) => {
    if (e.target.id === "formModal") e.target.classList.remove("open");
  });
  await load();
}

async function load() {
  const { announcements } = await api("/announcements");
  document.getElementById("tbody").innerHTML = announcements.length
    ? announcements
        .map(
          (a) => `<tr>
            <td>${escapeHtml(a.title)}</td><td>${escapeHtml(a.type)}</td><td>${formatDate(a.date)}</td>
            <td>
              <button class="a-btn a-btn-outline a-btn-sm" data-edit="${a.id}">Edit</button>
              <button class="a-btn a-btn-danger a-btn-sm" data-del="${a.id}">Hapus</button>
            </td>
          </tr>`
        )
        .join("")
    : `<tr><td colspan="4" class="a-empty">Belum ada pengumuman.</td></tr>`;

  document.querySelectorAll("[data-edit]").forEach((b) => b.addEventListener("click", () => openForm(announcements.find((a) => a.id === b.getAttribute("data-edit")))));
  document.querySelectorAll("[data-del]").forEach((b) =>
    b.addEventListener("click", async () => {
      if (!confirm("Hapus pengumuman ini?")) return;
      await api(`/announcements/${b.getAttribute("data-del")}`, { method: "DELETE" });
      showToast("Pengumuman dihapus.");
      load();
    })
  );
}

function openForm(a) {
  const modal = document.getElementById("formModal");
  const fieldId = "pgImg";
  document.getElementById("formModalBody").innerHTML = `
    <h3>${a ? "Edit" : "Tulis"} Pengumuman</h3>
    <form id="pForm">
      <div class="a-field"><label>Judul</label><input name="title" required value="${a ? escapeHtml(a.title) : ""}" /></div>
      <div class="a-field"><label>Tipe</label>
        <select name="type">${TYPES.map((t) => `<option ${a && a.type === t ? "selected" : ""}>${t}</option>`).join("")}</select>
      </div>
      <div class="a-field"><label>Isi pengumuman</label><textarea name="body" rows="5" required>${a ? escapeHtml(a.body) : ""}</textarea></div>
      ${renderMediaPickerField(fieldId, "Gambar (opsional)", a ? a.image : "")}
      <div class="a-field-hint" style="margin:-6px 0 12px">Ditampilkan sebagai kartu berita di beranda &amp; halaman Pengumuman, bukan status.</div>
      <div style="display:flex;gap:8px;margin-top:6px">
        <button type="button" class="a-btn a-btn-ghost" id="cancelForm" style="flex:1;justify-content:center">Batal</button>
        <button type="submit" class="a-btn a-btn-primary" style="flex:1;justify-content:center">Simpan</button>
      </div>
    </form>`;
  modal.classList.add("open");
  wireMediaPickerField(fieldId);
  document.getElementById("cancelForm").addEventListener("click", () => modal.classList.remove("open"));
  document.getElementById("pForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = Object.fromEntries(fd.entries());
    body.image = document.getElementById(fieldId).value || null;
    try {
      if (a) await api(`/announcements/${a.id}`, { method: "PATCH", body });
      else await api("/announcements", { method: "POST", body });
      showToast("Pengumuman disimpan.");
      modal.classList.remove("open");
      load();
    } catch (err) {
      showToast(err.message);
    }
  });
}

export default { render };
