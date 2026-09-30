import { api, formatRupiah, assetUrl, escapeHtml, showToast } from "../api.js";
import { renderImageField, wireImageField } from "../imageField.js";
import { icon } from "../icons.js";
import { actionCell, detailList, openModal, closeModal } from "../ui.js";

let items = [];

// Gambar topeng: kalau belum ada foto / file fotonya tidak ketemu -> tampil kotak penanda "Belum ada foto".
function thumbHtml(image, big = false) {
  const has = !!image;
  return `<div class="a-imgbox ${big ? "big" : ""} ${has ? "" : "no-img"}" title="${has ? "" : "Belum ada foto"}">
    ${has ? `<img src="${assetUrl(image)}" alt="" onerror="this.parentNode.classList.add('no-img')" />` : ""}
    <div class="a-imgbox-ph">${icon("image-plus")}${big ? "<span>Belum ada foto</span>" : ""}</div>
  </div>`;
}

async function render(el) {
  el.innerHTML = `
    <div class="a-toolbar"><button class="a-btn a-btn-primary" id="addBtn">${icon("plus")} Tambah Topeng</button></div>
    <div class="a-card"><div class="a-table-wrap"><table class="a-table a-compact">
      <thead><tr><th>Gambar</th><th>Nama</th><th>Harga</th><th>Stok</th><th>Aksi</th></tr></thead>
      <tbody id="tbody"><tr><td colspan="5">Memuat...</td></tr></tbody>
    </table></div></div>`;
  document.getElementById("addBtn").addEventListener("click", () => openForm(null));
  await load();
}

async function load() {
  const { topeng } = await api("/topeng");
  items = topeng;
  document.getElementById("tbody").innerHTML = items.length
    ? items
        .map(
          (t) => `<tr>
            <td>${thumbHtml(t.image)}</td>
            <td>${escapeHtml(t.name)}</td>
            <td>${formatRupiah(t.price)}</td>
            <td>${t.stock}</td>
            <td>${actionCell(t.id)}</td>
          </tr>`
        )
        .join("")
    : `<tr><td colspan="5" class="a-empty">Belum ada topeng di katalog.</td></tr>`;
  document.querySelectorAll("[data-detail]").forEach((b) => b.addEventListener("click", () => openDetail(b.getAttribute("data-detail"))));
  document.querySelectorAll("[data-edit]").forEach((b) => b.addEventListener("click", () => openForm(items.find((t) => t.id === b.getAttribute("data-edit")))));
}

function openDetail(id) {
  const t = items.find((x) => x.id === id);
  openModal(`
    <h3>${escapeHtml(t.name)}</h3>
    ${thumbHtml(t.image, true)}
    ${detailList([
      ["Karakter / watak", escapeHtml(t.character)],
      ["Warna dominan", escapeHtml(t.color)],
      ["Harga", formatRupiah(t.price)],
      ["Stok", String(t.stock)],
      ["Deskripsi", escapeHtml(t.desc)],
    ])}
    <div class="a-modal-foot"><button class="a-btn a-btn-ghost" id="closeBtn">Tutup</button></div>
  `);
  document.getElementById("closeBtn").addEventListener("click", closeModal);
}

function openForm(t) {
  const fieldId = "topengImg";
  const body = openModal(`
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
      ${renderImageField(fieldId, "Gambar Topeng", t ? t.image : "")}
      <div class="a-modal-foot">
        ${t ? `<button type="button" class="a-btn a-btn-danger" id="delBtn">Hapus</button>` : ""}
        <button type="button" class="a-btn a-btn-ghost" id="cancelBtn">Batal</button>
        <button type="submit" class="a-btn a-btn-primary">Simpan</button>
      </div>
    </form>`);
  wireImageField(fieldId);
  document.getElementById("cancelBtn").addEventListener("click", closeModal);
  if (t) {
    document.getElementById("delBtn").addEventListener("click", async () => {
      if (!confirm("Hapus topeng ini dari katalog?")) return;
      try {
        await api(`/topeng/${t.id}`, { method: "DELETE" });
        showToast("Topeng dihapus.");
        closeModal();
        load();
      } catch (err) {
        showToast(err.message);
      }
    });
  }
  body.querySelector("#tForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(e.target).entries());
    payload.image = document.getElementById(fieldId).value;
    try {
      if (t) await api(`/topeng/${t.id}`, { method: "PATCH", body: payload });
      else await api("/topeng", { method: "POST", body: payload });
      showToast("Topeng disimpan.");
      closeModal();
      load();
    } catch (err) {
      showToast(err.message);
    }
  });
}

export default { render };