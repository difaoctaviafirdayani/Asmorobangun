import { api, escapeHtml, showToast, assetUrl } from "../api.js";
import { renderMediaPickerField, wireMediaPickerField } from "../mediaPicker.js";

// Baca pengaturan metode pembayaran per fasilitas (default: semua aktif)
function readMethods(f) {
  const p = f.paymentMethods || {};
  return {
    cash: { enabled: !p.cash || p.cash.enabled !== false, note: (p.cash && p.cash.note) || "" },
    transfer: { enabled: !p.transfer || p.transfer.enabled !== false, note: (p.transfer && p.transfer.note) || "" },
    qris: { enabled: !p.qris || p.qris.enabled !== false, image: (p.qris && p.qris.image) || "" },
  };
}

async function render(el) {
  el.innerHTML = `<div id="list">Memuat...</div>`;
  const { facilities } = await api("/facilities");

  document.getElementById("list").innerHTML = facilities
    .map((f) => {
      const m = readMethods(f);
      return `<div class="a-card a-card-pad" style="margin-bottom:16px">
        <h3 style="font-size:1rem;margin-bottom:12px">${escapeHtml(f.name)}</h3>
        <form data-fid="${f.id}">
          <div class="a-field"><label>Nama</label><input name="name" value="${escapeHtml(f.name)}" /></div>
          <div class="a-field"><label>Harga</label><input name="priceInfo" value="${escapeHtml(f.priceInfo)}" /></div>
          <div class="a-field"><label>Deskripsi</label><textarea name="longDesc" rows="4">${escapeHtml(f.longDesc)}</textarea></div>

          <div class="a-field">
            <label>Metode Pembayaran</label>

            <div style="border:1.5px solid var(--line);border-radius:10px;padding:12px;margin-bottom:10px">
              <label style="display:flex;gap:8px;align-items:center;font-weight:700;margin-bottom:8px">
                <input type="checkbox" name="cashEnabled" style="width:auto" ${m.cash.enabled ? "checked" : ""} /> Tunai
              </label>
              <label style="font-size:0.75rem;font-weight:600">Catatan</label>
              <input name="cashNote" placeholder="mis. Bayar di sanggar" value="${escapeHtml(m.cash.note)}" />
            </div>

            <div style="border:1.5px solid var(--line);border-radius:10px;padding:12px;margin-bottom:10px">
              <label style="display:flex;gap:8px;align-items:center;font-weight:700;margin-bottom:8px">
                <input type="checkbox" name="transferEnabled" style="width:auto" ${m.transfer.enabled ? "checked" : ""} /> Transfer Bank
              </label>
              <label style="font-size:0.75rem;font-weight:600">Catatan</label>
              <input name="transferNote" placeholder="mis. 1234567890 (BCA a.n. Sanggar Asmorobangun)" value="${escapeHtml(m.transfer.note)}" />
            </div>

            <div style="border:1.5px solid var(--line);border-radius:10px;padding:12px">
              <label style="display:flex;gap:8px;align-items:center;font-weight:700;margin-bottom:8px">
                <input type="checkbox" name="qrisEnabled" style="width:auto" ${m.qris.enabled ? "checked" : ""} /> QRIS
              </label>
              <label style="font-size:0.75rem;font-weight:600">Gambar QRIS Merchant</label>
              <div style="display:flex;gap:10px;align-items:center;margin-top:6px">
                <img class="a-picker-preview" id="qrisPrev-${f.id}" src="${m.qris.image ? assetUrl(m.qris.image) : ""}" onerror="this.style.opacity=0" />
                <div>
                  <input type="hidden" name="qrisImage" value="${escapeHtml(m.qris.image)}" />
                  <input type="file" accept="image/*" id="qrisFile-${f.id}" style="display:none" />
                  <button type="button" class="a-btn a-btn-outline a-btn-sm" data-upload-qris="${f.id}">⬆️ Unggah QRIS</button>
                </div>
              </div>
            </div>
          </div>

          ${renderMediaPickerField(`img-${f.id}`, "Gambar", f.image)}
          <button class="a-btn a-btn-primary" type="submit">Simpan</button>
        </form>
      </div>`;
    })
    .join("");

  facilities.forEach((f) => wireMediaPickerField(`img-${f.id}`));

  // Unggah gambar QRIS
  document.querySelectorAll("[data-upload-qris]").forEach((btn) => {
    const fid = btn.getAttribute("data-upload-qris");
    const fileInput = document.getElementById(`qrisFile-${fid}`);
    btn.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", async () => {
      const file = fileInput.files[0];
      if (!file) return;
      const fd = new FormData();
      fd.append("image", file);
      try {
        const { item } = await api("/uploads/image", { method: "POST", isForm: true, body: fd });
        const form = document.querySelector(`form[data-fid="${fid}"]`);
        form.elements["qrisImage"].value = item.url;
        const prev = document.getElementById(`qrisPrev-${fid}`);
        prev.src = assetUrl(item.url);
        prev.style.opacity = 1;
        showToast("Gambar QRIS diunggah. Klik Simpan untuk menyimpan.");
      } catch (err) {
        showToast(err.message);
      }
      fileInput.value = "";
    });
  });

  // Simpan
  document.querySelectorAll("form[data-fid]").forEach((form) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fid = form.getAttribute("data-fid");
      const g = (n) => form.elements[n];
      const body = {
        name: g("name").value,
        priceInfo: g("priceInfo").value,
        longDesc: g("longDesc").value,
        image: document.getElementById(`img-${fid}`).value,
        paymentMethods: {
          cash: { enabled: g("cashEnabled").checked, note: g("cashNote").value },
          transfer: { enabled: g("transferEnabled").checked, note: g("transferNote").value },
          qris: { enabled: g("qrisEnabled").checked, image: g("qrisImage").value },
        },
      };
      try {
        await api(`/facilities/${fid}`, { method: "PATCH", body });
        showToast("Fasilitas diperbarui.");
      } catch (err) {
        showToast(err.message);
      }
    });
  });
}

export default { render };