import { api, assetUrl, showToast } from "./api.js";

// Renders a compact "current image + pick from library" control.
// fieldId must be unique per instance on the page.
export function renderMediaPickerField(fieldId, label, currentValue) {
  return `
    <div class="a-field">
      <label>${label}</label>
      <div style="display:flex;gap:10px;align-items:center">
        <img class="a-picker-preview" id="${fieldId}-preview" src="${currentValue ? assetUrl(currentValue) : ""}" onerror="this.style.opacity=0"/>
        <div style="flex:1">
          <input type="hidden" id="${fieldId}" value="${currentValue || ""}" />
          <button type="button" class="a-btn a-btn-outline a-btn-sm" id="${fieldId}-pick">🗂️ Pilih dari Pustaka Media</button>
          <div class="a-field-hint">Kelola/unggah gambar baru (termasuk lewat .zip) di menu "Pustaka Media".</div>
        </div>
      </div>
    </div>`;
}

export function wireMediaPickerField(fieldId) {
  const btn = document.getElementById(`${fieldId}-pick`);
  if (!btn) return;
  btn.addEventListener("click", () => openPickerModal(fieldId));
}

async function openPickerModal(fieldId) {
  let modal = document.getElementById("mediaPickerModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.className = "a-modal-overlay";
    modal.id = "mediaPickerModal";
    document.body.appendChild(modal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.remove("open");
    });
  }
  modal.innerHTML = `
    <div class="a-modal">
      <h3 style="font-size:1.05rem">Pilih Gambar</h3>
      <div id="mpGrid" class="a-media-grid" style="margin:14px 0">Memuat...</div>
      <button type="button" class="a-btn a-btn-ghost" style="width:100%" id="mpClose">Tutup</button>
    </div>`;
  modal.classList.add("open");
  document.getElementById("mpClose").addEventListener("click", () => modal.classList.remove("open"));

  try {
    const { media } = await api("/uploads/library");
    document.getElementById("mpGrid").innerHTML = media.length
      ? media
          .map((m) => `<div class="a-media-item" data-url="${m.url}" title="${m.name}"><img src="${assetUrl(m.url)}"/></div>`)
          .join("")
      : `<div class="a-empty">Pustaka media masih kosong. Unggah gambar dulu di menu "Pustaka Media".</div>`;
    document.querySelectorAll("#mpGrid [data-url]").forEach((el) => {
      el.addEventListener("click", () => {
        const url = el.getAttribute("data-url");
        document.getElementById(fieldId).value = url;
        document.getElementById(`${fieldId}-preview`).src = assetUrl(url);
        document.getElementById(`${fieldId}-preview`).style.opacity = 1;
        modal.classList.remove("open");
      });
    });
  } catch (err) {
    document.getElementById("mpGrid").innerHTML = `<div class="a-empty">Gagal memuat pustaka media.</div>`;
  }
}
