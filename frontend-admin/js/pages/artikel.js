import { api, formatDate, escapeHtml, showToast } from "../api.js";
import { renderMediaPickerField, wireMediaPickerField } from "../mediaPicker.js";

async function render(el) {
  el.innerHTML = `
    <div class="a-toolbar"><button class="a-btn a-btn-primary" id="addBtn">➕ Tulis Artikel</button></div>
    <div class="a-card"><div class="a-table-wrap"><table class="a-table"><thead><tr><th>Judul</th><th>Kategori</th><th>Tanggal</th><th>Aksi</th></tr></thead><tbody id="tbody"><tr><td colspan="4">Memuat...</td></tr></tbody></table></div></div>
    <div class="a-modal-overlay" id="formModal"><div class="a-modal" id="formModalBody"></div></div>
  `;
  document.getElementById("addBtn").addEventListener("click", () => openForm(null));
  document.getElementById("formModal").addEventListener("click", (e) => {
    if (e.target.id === "formModal") e.target.classList.remove("open");
  });
  await load();
}

async function load() {
  const { articles } = await api("/articles");
  document.getElementById("tbody").innerHTML = articles.length
    ? articles
        .map(
          (a) => `<tr>
            <td>${escapeHtml(a.title)}</td><td>${escapeHtml(a.category)}</td><td>${formatDate(a.date)}</td>
            <td>
              <button class="a-btn a-btn-outline a-btn-sm" data-edit="${a.id}">Edit</button>
              <button class="a-btn a-btn-danger a-btn-sm" data-del="${a.id}">Hapus</button>
            </td>
          </tr>`
        )
        .join("")
    : `<tr><td colspan="4" class="a-empty">Belum ada artikel.</td></tr>`;

  document.querySelectorAll("[data-edit]").forEach((b) => b.addEventListener("click", () => openForm(articles.find((a) => a.id === b.getAttribute("data-edit")))));
  document.querySelectorAll("[data-del]").forEach((b) =>
    b.addEventListener("click", async () => {
      if (!confirm("Hapus artikel ini?")) return;
      await api(`/articles/${b.getAttribute("data-del")}`, { method: "DELETE" });
      showToast("Artikel dihapus.");
      load();
    })
  );
}

function openForm(a) {
  const modal = document.getElementById("formModal");
  const fieldId = "artImg";
  document.getElementById("formModalBody").innerHTML = `
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
      ${renderMediaPickerField(fieldId, "Gambar Sampul", a ? a.image : "")}
      <div style="display:flex;gap:8px;margin-top:6px">
        <button type="button" class="a-btn a-btn-ghost" id="cancelForm" style="flex:1;justify-content:center">Batal</button>
        <button type="submit" class="a-btn a-btn-primary" style="flex:1;justify-content:center">Simpan</button>
      </div>
    </form>`;
  modal.classList.add("open");
  wireMediaPickerField(fieldId);
  document.getElementById("cancelForm").addEventListener("click", () => modal.classList.remove("open"));
  document.getElementById("aForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = Object.fromEntries(fd.entries());
    body.featured = body.featured === "true";
    body.image = document.getElementById(fieldId).value;
    try {
      if (a) await api(`/articles/${a.id}`, { method: "PATCH", body });
      else await api("/articles", { method: "POST", body });
      showToast("Artikel disimpan.");
      modal.classList.remove("open");
      load();
    } catch (err) {
      showToast(err.message);
    }
  });
}

export default { render };
