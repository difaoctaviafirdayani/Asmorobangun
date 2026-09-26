import { api, formatRupiah, assetUrl, escapeHtml, showToast } from "../api.js";
import { renderMediaPickerField, wireMediaPickerField } from "../mediaPicker.js";

async function render(el) {
  el.innerHTML = `
    <div class="a-toolbar"><button class="a-btn a-btn-primary" id="addBtn">➕ Tambah Topeng</button></div>
    <div class="a-card"><div class="a-table-wrap"><table class="a-table"><thead><tr><th>Gambar</th><th>Nama</th><th>Karakter</th><th>Harga</th><th>Stok</th><th>Aksi</th></tr></thead><tbody id="tbody"><tr><td colspan="6">Memuat...</td></tr></tbody></table></div></div>
    <div class="a-modal-overlay" id="formModal"><div class="a-modal" id="formModalBody"></div></div>
  `;
  document.getElementById("addBtn").addEventListener("click", () => openForm(null));
  document.getElementById("formModal").addEventListener("click", (e) => {
    if (e.target.id === "formModal") e.target.classList.remove("open");
  });
  await load();
}

async function load() {
  const { topeng } = await api("/topeng");
  document.getElementById("tbody").innerHTML = topeng.length
    ? topeng
        .map(
          (t) => `<tr>
            <td><img class="a-thumb" src="${assetUrl(t.image)}" onerror="this.style.opacity=0"/></td>
            <td>${escapeHtml(t.name)}</td>
            <td>${escapeHtml(t.character)}</td>
            <td>${formatRupiah(t.price)}</td>
            <td>${t.stock}</td>
            <td>
              <button class="a-btn a-btn-outline a-btn-sm" data-edit="${t.id}">Edit</button>
              <button class="a-btn a-btn-danger a-btn-sm" data-del="${t.id}">Hapus</button>
            </td>
          </tr>`
        )
        .join("")
    : `<tr><td colspan="6" class="a-empty">Belum ada topeng di katalog.</td></tr>`;

  document.querySelectorAll("[data-edit]").forEach((b) => b.addEventListener("click", () => openForm(topeng.find((t) => t.id === b.getAttribute("data-edit")))));
  document.querySelectorAll("[data-del]").forEach((b) =>
    b.addEventListener("click", async () => {
      if (!confirm("Hapus topeng ini dari katalog?")) return;
      try {
        await api(`/topeng/${b.getAttribute("data-del")}`, { method: "DELETE" });
        showToast("Topeng dihapus.");
        load();
      } catch (err) {
        showToast(err.message);
      }
    })
  );
}

function openForm(t) {
  const modal = document.getElementById("formModal");
  const fieldId = "topengImg";
  document.getElementById("formModalBody").innerHTML = `
    <h3>${t ? "Edit" : "Tambah"} Topeng</h3>
    <form id="tForm">
      <div class="a-field"><label>Nama</label><input name="name" required value="${t ? escapeHtml(t.name) : ""}" /></div>
      <div class="a-form-grid">
        <div class="a-field"><label>Karakter/Watak</label><input name="character" value="${t ? escapeHtml(t.character) : ""}" /></div>
        <div class="a-field"><label>Warna Dominan</label><input name="color" value="${t ? escapeHtml(t.color) : ""}" /></div>
      </div>
      <div class="a-form-grid">
        <div class="a-field"><label>Harga (Rp)</label><input name="price" type="number" required value="${t ? t.price : ""}" /></div>
        <div class="a-field"><label>Stok</label><input name="stock" type="number" value="${t ? t.stock : 0}" /></div>
      </div>
      <div class="a-field"><label>Deskripsi</label><textarea name="desc" rows="3">${t ? escapeHtml(t.desc) : ""}</textarea></div>
      ${renderMediaPickerField(fieldId, "Gambar Topeng", t ? t.image : "")}
      <div style="display:flex;gap:8px;margin-top:6px">
        <button type="button" class="a-btn a-btn-ghost" id="cancelForm" style="flex:1;justify-content:center">Batal</button>
        <button type="submit" class="a-btn a-btn-primary" style="flex:1;justify-content:center">Simpan</button>
      </div>
    </form>`;
  modal.classList.add("open");
  wireMediaPickerField(fieldId);
  document.getElementById("cancelForm").addEventListener("click", () => modal.classList.remove("open"));
  document.getElementById("tForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = Object.fromEntries(fd.entries());
    body.image = document.getElementById(fieldId).value;
    try {
      if (t) await api(`/topeng/${t.id}`, { method: "PATCH", body });
      else await api("/topeng", { method: "POST", body });
      showToast("Topeng disimpan.");
      modal.classList.remove("open");
      load();
    } catch (err) {
      showToast(err.message);
    }
  });
}

export default { render };
