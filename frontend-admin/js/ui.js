import { icon } from "./icons.js";

// Dua tombol Aksi terpisah: Detail (ikon info) dan Edit (ikon pensil)
export function actionCell(id) {
  return `<div class="a-actions">
    <button type="button" class="a-icon-btn" data-detail="${id}" title="Detail" aria-label="Detail">${icon("info")}</button>
    <button type="button" class="a-icon-btn" data-edit="${id}" title="Edit" aria-label="Edit">${icon("pencil")}</button>
  </div>`;
}

// Kolom "Ubah status" dengan penanda bahwa ada pilihan lain (tanda + dan panah dropdown)
export function statusField({ options, labels, current, id = "statusSelect" }) {
  const others = Math.max(options.length - 1, 0);
  return `<div class="a-field a-status-field">
    <label>Ubah status <span class="a-plus-chip">${icon("plus")} ${others} pilihan lain</span></label>
    <div class="a-select-wrap">
      <select class="a-select" id="${id}">${options.map((s) => `<option value="${s}" ${s === current ? "selected" : ""}>${labels[s] || s}</option>`).join("")}</select>
      <span class="a-select-arrow">${icon("chevron-down")}</span>
    </div>
    <div class="a-field-hint">Ketuk kolom di atas untuk memilih status lain, lalu klik Simpan.</div>
  </div>`;
}

// Baris "label : isi" untuk tampilan detail (hanya-baca)
export function detailList(rows) {
  return `<div class="a-detail-list">${rows
    .filter((r) => r && r[1] !== undefined && r[1] !== null && r[1] !== "")
    .map(([l, v]) => `<div class="a-dl-row"><span class="a-dl-label">${l}</span><span class="a-dl-val">${v}</span></div>`)
    .join("")}</div>`;
}

export function truncate(str, n = 70) {
  const s = String(str == null ? "" : str);
  return s.length > n ? s.slice(0, n).trim() + "…" : s;
}

// Nomor HP -> tautan WhatsApp (08xx -> 628xx)
export function waLink(phone) {
  let d = String(phone || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("0")) d = "62" + d.slice(1);
  return `https://wa.me/${d}`;
}

// Modal bersama (satu overlay untuk semua halaman)
export function openModal(html) {
  let ov = document.getElementById("uiModal");
  if (!ov) {
    ov = document.createElement("div");
    ov.id = "uiModal";
    ov.className = "a-modal-overlay";
    ov.innerHTML = `<div class="a-modal" id="uiModalBody"></div>`;
    ov.addEventListener("click", (e) => {
      if (e.target === ov) closeModal();
    });
    document.body.appendChild(ov);
  }
  const body = document.getElementById("uiModalBody");
  body.innerHTML = html;
  ov.classList.add("open");
  return body;
}
export function closeModal() {
  const ov = document.getElementById("uiModal");
  if (ov) ov.classList.remove("open");
}
