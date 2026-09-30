import { api, formatDate, escapeHtml, showToast, assetUrl } from "../api.js";
import { renderImageField, wireImageField } from "../imageField.js";
import { icon } from "../icons.js";
import { actionCell, detailList, openModal, closeModal } from "../ui.js";

let items = [];

async function render(el) {
  el.innerHTML = `
    <div class="a-toolbar"><button class="a-btn a-btn-primary" id="addBtn">${icon("plus")} Tulis Artikel</button></div>
    <div class="a-card"><div class="a-table-wrap"><table class="a-table a-compact">
      <thead><tr><th>Judul</th><th>Kategori</th><th>Tanggal</th><th>Aksi</th></tr></thead>
      <tbody id="tbody"><tr><td colspan="4">Memuat...</td></tr></tbody>
    </table></div></div>`;
  document.getElementById("addBtn").addEventListener("click", () => openForm(null));
  await load();
}

async function load() {
  const { articles } = await api("/articles");
  items = articles;
  document.getElementById("tbody").innerHTML = items.length
    ? items
        .map(
          (a) => `<tr>
            <td>${escapeHtml(a.title)}</td><td>${escapeHtml(a.category)}</td><td>${formatDate(a.date)}</td>
            <td>${actionCell(a.id)}</td>
          </tr>`
        )
        .join("")
    : `<tr><td colspan="4" class="a-empty">Belum ada artikel.</td></tr>`;
  document.querySelectorAll("[data-detail]").forEach((b) => b.addEventListener("click", () => openDetail(b.getAttribute("data-detail"))));
  document.querySelectorAll("[data-edit]").forEach((b) => b.addEventListener("click", () => openForm(items.find((a) => a.id === b.getAttribute("data-edit")))));
}

function openDetail(id) {
  const a = items.find((x) => x.id === id);
  openModal(`
    <h3>${escapeHtml(a.title)}</h3>
    ${a.image ? `<img class="a-detail-img" src="${assetUrl(a.image)}" onerror="this.style.display='none'" />` : ""}
    ${detailList([
      ["Kategori", escapeHtml(a.category)],
      ["Penulis", escapeHtml(a.author)],
      ["Tanggal", formatDate(a.date)],
      ["Sorotan utama", a.featured ? "Ya" : "Tidak"],
      ["Ringkasan", escapeHtml(a.excerpt)],
      ["Isi artikel", escapeHtml(a.content)],
    ])}
    <div class="a-modal-foot"><button class="a-btn a-btn-ghost" id="closeBtn">Tutup</button></div>
  `);
  document.getElementById("closeBtn").addEventListener("click", closeModal);
}

function openForm(a) {
  const fieldId = "artImg";
  const body = openModal(`
    <h3>${a ? "Edit" : "Tulis"} Artikel</h3>
    <form id="aForm">
      <div class="a-field"><label>Judul</label><input name="title" required value="${a ? escapeHtml(a.title) : ""}" /></div>
      <div class="a-form-grid">
        <div class="a-field"><label>Kategori</label><input name="category" value="${a ? escapeHtml(a.category) : "Berita"}" /></div>
        <div class="a-field"><label>Sorotan Utama?</label>
          <select name="featured"><option value="false" ${a && !a.featured ? "selected" : ""}>Tidak</option><option value="true" ${a && a.featured ? "selected" : ""}>Ya</option></select>
        </div>
      </div>
      <div class="a-field"><label>Ringkasan</label><textarea name="excerpt" rows="2">${a ? escapeHtml(a.excerpt) : ""}</textarea></div>
      <div class="a-field"><label>Isi artikel</label><textarea name="content" rows="6">${a ? escapeHtml(a.content) : ""}</textarea></div>
      ${renderImageField(fieldId, "Gambar Sampul", a ? a.image : "")}
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
      if (!confirm("Hapus artikel ini?")) return;
      try {
        await api(`/articles/${a.id}`, { method: "DELETE" });
        showToast("Artikel dihapus.");
        closeModal();
        load();
      } catch (err) {
        showToast(err.message);
      }
    });
  }
  body.querySelector("#aForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(e.target).entries());
    payload.featured = payload.featured === "true";
    payload.image = document.getElementById(fieldId).value;
    try {
      if (a) await api(`/articles/${a.id}`, { method: "PATCH", body: payload });
      else await api("/articles", { method: "POST", body: payload });
      showToast("Artikel disimpan.");
      closeModal();
      load();
    } catch (err) {
      showToast(err.message);
    }
  });
}

export default { render };
