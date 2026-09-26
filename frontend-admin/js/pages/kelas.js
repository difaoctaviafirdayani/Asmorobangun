import { api, escapeHtml, showToast } from "../api.js";
import { renderMediaPickerField, wireMediaPickerField } from "../mediaPicker.js";

async function render(el) {
  el.innerHTML = `<div id="list">Memuat...</div>`;
  const { facilities } = await api("/facilities");
  document.getElementById("list").innerHTML = facilities
    .map(
      (f) => `<div class="a-card a-card-pad" style="margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <h3 style="font-size:1rem">${escapeHtml(f.name)}</h3>
          <span class="a-badge wait">${escapeHtml(f.category)}</span>
        </div>
        <form data-fid="${f.id}">
          <div class="a-form-grid">
            <div class="a-field"><label>Nama</label><input name="name" value="${escapeHtml(f.name)}" /></div>
            <div class="a-field"><label>Info Harga</label><input name="priceInfo" value="${escapeHtml(f.priceInfo)}" /></div>
          </div>
          <div class="a-field"><label>Deskripsi singkat</label><input name="shortDesc" value="${escapeHtml(f.shortDesc)}" /></div>
          <div class="a-field"><label>Deskripsi lengkap</label><textarea name="longDesc" rows="3">${escapeHtml(f.longDesc)}</textarea></div>
          ${renderMediaPickerField(`img-${f.id}`, "Gambar", f.image)}
          <button class="a-btn a-btn-primary" type="submit">Simpan Perubahan</button>
        </form>
      </div>`
    )
    .join("");

  facilities.forEach((f) => wireMediaPickerField(`img-${f.id}`));

  document.querySelectorAll("form[data-fid]").forEach((form) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fid = form.getAttribute("data-fid");
      const fd = new FormData(form);
      const body = Object.fromEntries(fd.entries());
      body.image = document.getElementById(`img-${fid}`).value;
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
