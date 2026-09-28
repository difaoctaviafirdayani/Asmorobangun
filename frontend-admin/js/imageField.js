import { api, assetUrl, showToast } from "./api.js";
import { icon } from "./icons.js";

// Kolom upload foto langsung di tempat fitur/form-nya (tanpa Pustaka Media).
// Pilih file -> langsung diunggah ke server -> URL-nya disimpan di <input hidden id=fieldId>.
// Form yang memakainya tinggal membaca document.getElementById(fieldId).value saat menyimpan.
// fieldId harus unik dalam satu halaman.
export function renderImageField(fieldId, label, currentValue) {
  return `
    <div class="a-field">
      <label>${label}</label>
      <div class="a-upload">
        <img class="a-picker-preview" id="${fieldId}-preview" src="${currentValue ? assetUrl(currentValue) : ""}" alt="" onerror="this.style.visibility='hidden'" />
        <div style="flex:1;min-width:0">
          <input type="hidden" id="${fieldId}" value="${currentValue || ""}" />
          <input type="file" id="${fieldId}-file" accept="image/*" style="display:none" />
          <button type="button" class="a-btn a-btn-outline a-btn-sm" id="${fieldId}-pick">${icon("upload")} ${currentValue ? "Ganti foto" : "Pilih foto"}</button>
          <div class="a-field-hint" id="${fieldId}-status">Format JPG, PNG, WEBP atau GIF, maksimal 8 MB.</div>
        </div>
      </div>
    </div>`;
}

export function wireImageField(fieldId) {
  const btn = document.getElementById(`${fieldId}-pick`);
  const fileInput = document.getElementById(`${fieldId}-file`);
  if (!btn || !fileInput) return;
  const status = document.getElementById(`${fieldId}-status`);
  const preview = document.getElementById(`${fieldId}-preview`);

  btn.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    if (!file) return;

    // Tampilkan pratinjau langsung dari file yang dipilih
    preview.style.visibility = "visible";
    preview.src = URL.createObjectURL(file);
    status.textContent = "Mengunggah...";
    btn.disabled = true;

    const fd = new FormData();
    fd.append("image", file);
    try {
      const { item } = await api("/uploads/image", { method: "POST", isForm: true, body: fd });
      document.getElementById(fieldId).value = item.url;
      status.textContent = "Foto terunggah. Klik Simpan untuk menyimpan perubahan.";
      btn.innerHTML = `${icon("upload")} Ganti foto`;
    } catch (err) {
      status.textContent = err.message;
      showToast(err.message);
    }
    btn.disabled = false;
    fileInput.value = "";
  });
}
