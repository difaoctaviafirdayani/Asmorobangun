import { api, assetUrl, escapeHtml, showToast } from "../api.js";
import { renderMediaPickerField, wireMediaPickerField } from "../mediaPicker.js";

async function render(el) {
  el.innerHTML = `
    <div class="a-toolbar"><button class="a-btn a-btn-primary" id="addBtn">➕ Tambah Foto</button></div>
    <div class="a-media-grid" id="grid" style="grid-template-columns:repeat(auto-fill,minmax(150px,1fr));max-height:none">Memuat...</div>
    <div class="a-modal-overlay" id="formModal"><div class="a-modal" id="formModalBody"></div></div>
  `;
  document.getElementById("addBtn").addEventListener("click", () => openForm(null));
  document.getElementById("formModal").addEventListener("click", (e) => {
    if (e.target.id === "formModal") e.target.classList.remove("open");
  });
  await load();
}

async function load() {
  const { gallery } = await api("/gallery");
  document.getElementById("grid").innerHTML = gallery.length
    ? gallery
        .map(
          (g) => `<div class="a-card" style="padding:8px">
            <img src="${assetUrl(g.image)}" style="width:100%;height:110px;object-fit:cover;border-radius:8px" onerror="this.style.opacity=0.3"/>
            <div style="font-size:0.82rem;font-weight:700;margin-top:6px">${escapeHtml(g.title)}</div>
            <div style="display:flex;gap:6px;margin-top:6px">
              <button class="a-btn a-btn-outline a-btn-sm" data-edit="${g.id}" style="flex:1;justify-content:center">Edit</button>
              <button class="a-btn a-btn-danger a-btn-sm" data-del="${g.id}" style="flex:1;justify-content:center">Hapus</button>
            </div>
          </div>`
        )
        .join("")
    : `<div class="a-empty">Belum ada foto di galeri.</div>`;

  document.querySelectorAll("[data-edit]").forEach((b) => b.addEventListener("click", () => openForm(gallery.find((g) => g.id === b.getAttribute("data-edit")))));
  document.querySelectorAll("[data-del]").forEach((b) =>
    b.addEventListener("click", async () => {
      if (!confirm("Hapus foto ini dari galeri?")) return;
      await api(`/gallery/${b.getAttribute("data-del")}`, { method: "DELETE" });
      showToast("Foto dihapus.");
      load();
    })
  );
}

function openForm(g) {
  const modal = document.getElementById("formModal");
  const fieldId = "galImg";
  document.getElementById("formModalBody").innerHTML = `
    <h3>${g ? "Edit" : "Tambah"} Foto Galeri</h3>
    <form id="gForm">
      <div class="a-field"><label>Judul</label><input name="title" required value="${g ? escapeHtml(g.title) : ""}" /></div>
      <div class="a-field"><label>Keterangan</label><textarea name="caption" rows="2">${g ? escapeHtml(g.caption || "") : ""}</textarea></div>
      ${renderMediaPickerField(fieldId, "Gambar", g ? g.image : "")}
      <div style="display:flex;gap:8px;margin-top:6px">
        <button type="button" class="a-btn a-btn-ghost" id="cancelForm" style="flex:1;justify-content:center">Batal</button>
        <button type="submit" class="a-btn a-btn-primary" style="flex:1;justify-content:center">Simpan</button>
      </div>
    </form>`;
  modal.classList.add("open");
  wireMediaPickerField(fieldId);
  document.getElementById("cancelForm").addEventListener("click", () => modal.classList.remove("open"));
  document.getElementById("gForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = Object.fromEntries(fd.entries());
    body.image = document.getElementById(fieldId).value;
    if (!body.image) return showToast("Pilih gambar dulu.");
    try {
      if (g) await api(`/gallery/${g.id}`, { method: "PATCH", body });
      else await api("/gallery", { method: "POST", body });
      showToast("Galeri disimpan.");
      modal.classList.remove("open");
      load();
    } catch (err) {
      showToast(err.message);
    }
  });
}

export default { render };
