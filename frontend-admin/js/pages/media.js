import { api, assetUrl, escapeHtml, showToast } from "../api.js";

async function render(el) {
  el.innerHTML = `
    <div class="a-card a-card-pad" style="margin-bottom:18px">
      <h3 style="font-size:1rem">Unggah Gambar Baru</h3>
      <p class="a-field-hint" style="margin-bottom:14px">Unggah satu gambar, atau unggah file <strong>.zip</strong> berisi banyak gambar sekaligus (misalnya saat mengganti seluruh koleksi foto topeng/galeri). Semua gambar yang diunggah bisa langsung dipilih di halaman Kelola Topeng, Kelola Galeri, Kelola Artikel, dan Kelola Pengumuman.</p>
      <div class="a-form-grid">
        <div>
          <label style="font-size:0.78rem;font-weight:700;color:var(--wood-900);display:block;margin-bottom:6px">Gambar tunggal</label>
          <div class="a-drop-zone" id="singleDrop">📷 Klik untuk pilih gambar (JPG/PNG/WEBP/GIF)</div>
          <input type="file" id="singleInput" accept="image/*" style="display:none" />
        </div>
        <div>
          <label style="font-size:0.78rem;font-weight:700;color:var(--wood-900);display:block;margin-bottom:6px">Unggah massal (.zip)</label>
          <div class="a-drop-zone" id="zipDrop">🗜️ Klik untuk pilih file .zip berisi gambar</div>
          <input type="file" id="zipInput" accept=".zip" style="display:none" />
        </div>
      </div>
      <div id="uploadStatus" style="margin-top:10px;font-size:0.82rem;color:var(--ink-soft)"></div>
    </div>

    <div class="a-card a-card-pad">
      <h3 style="font-size:1rem">Pustaka Media</h3>
      <div class="a-media-grid" id="grid" style="margin-top:10px;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));max-height:none">Memuat...</div>
    </div>
  `;

  document.getElementById("singleDrop").addEventListener("click", () => document.getElementById("singleInput").click());
  document.getElementById("zipDrop").addEventListener("click", () => document.getElementById("zipInput").click());

  document.getElementById("singleInput").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("image", file);
    setStatus("Mengunggah gambar...");
    try {
      await api("/uploads/image", { method: "POST", isForm: true, body: fd });
      setStatus("Gambar berhasil diunggah!");
      showToast("Gambar diunggah.");
      load();
    } catch (err) {
      setStatus("");
      showToast(err.message);
    }
    e.target.value = "";
  });

  document.getElementById("zipInput").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("zip", file);
    setStatus("Mengekstrak file .zip, mohon tunggu...");
    try {
      const res = await api("/uploads/zip", { method: "POST", isForm: true, body: fd });
      setStatus(`Berhasil menambahkan ${res.count} gambar dari .zip!`);
      showToast(`${res.count} gambar ditambahkan.`);
      load();
    } catch (err) {
      setStatus("");
      showToast(err.message);
    }
    e.target.value = "";
  });

  function setStatus(msg) {
    document.getElementById("uploadStatus").textContent = msg;
  }

  await load();
}

async function load() {
  const { media } = await api("/uploads/library");
  document.getElementById("grid").innerHTML = media.length
    ? media
        .map(
          (m) => `<div class="a-media-item" title="${escapeHtml(m.name)}">
            <img src="${assetUrl(m.url)}"/>
            <button class="del-btn" data-del="${m.id}">✕</button>
          </div>`
        )
        .join("")
    : `<div class="a-empty">Pustaka media masih kosong. Unggah gambar di atas untuk mulai.</div>`;

  document.querySelectorAll("[data-del]").forEach((b) =>
    b.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (!confirm("Hapus gambar ini dari pustaka media?")) return;
      await api(`/uploads/library/${b.getAttribute("data-del")}`, { method: "DELETE" });
      load();
    })
  );
}

export default { render };
