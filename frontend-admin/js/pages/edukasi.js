import { api, escapeHtml, showToast } from "../api.js";

async function render(el) {
  el.innerHTML = `<div id="wrap">Memuat...</div>`;
  await load();
}

async function load() {
  const { cultureInfo } = await api("/culture");
  document.getElementById("wrap").innerHTML = `
    <div class="a-card a-card-pad" style="margin-bottom:16px">
      <h3 style="font-size:1rem">Paragraf Pengantar Budaya</h3>
      <div class="a-field"><textarea id="paragraph" rows="4">${escapeHtml(cultureInfo.paragraph || "")}</textarea></div>
      <button class="a-btn a-btn-primary" id="saveParagraph">Simpan Paragraf</button>
    </div>

    <div class="a-card a-card-pad">
      <h3 style="font-size:1rem">Linimasa Sejarah</h3>
      <div id="timelineList">
        ${cultureInfo.timeline
          .map(
            (t) => `<div style="display:flex;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--line)">
              <strong style="min-width:60px">${escapeHtml(t.year)}</strong>
              <span style="flex:1;font-size:0.85rem">${escapeHtml(t.text)}</span>
              <button class="a-btn a-btn-danger a-btn-sm" data-del="${t.id}">Hapus</button>
            </div>`
          )
          .join("")}
      </div>
      <div class="a-form-grid" style="margin-top:14px">
        <div class="a-field"><label>Tahun</label><input id="newYear" placeholder="mis. 1930" /></div>
        <div class="a-field" style="grid-column:span 2"><label>Keterangan</label><input id="newText" placeholder="Peristiwa penting..." /></div>
      </div>
      <button class="a-btn a-btn-outline" id="addTimeline">➕ Tambah Poin</button>
    </div>
  `;

  document.getElementById("saveParagraph").addEventListener("click", async () => {
    try {
      await api("/culture", { method: "PUT", body: { paragraph: document.getElementById("paragraph").value } });
      showToast("Paragraf diperbarui.");
    } catch (err) {
      showToast(err.message);
    }
  });

  document.querySelectorAll("[data-del]").forEach((b) =>
    b.addEventListener("click", async () => {
      await api(`/culture/timeline/${b.getAttribute("data-del")}`, { method: "DELETE" });
      showToast("Poin linimasa dihapus.");
      load();
    })
  );

  document.getElementById("addTimeline").addEventListener("click", async () => {
    const year = document.getElementById("newYear").value.trim();
    const text = document.getElementById("newText").value.trim();
    if (!year || !text) return showToast("Isi tahun dan keterangan.");
    try {
      await api("/culture/timeline", { method: "POST", body: { year, text } });
      showToast("Poin linimasa ditambahkan.");
      load();
    } catch (err) {
      showToast(err.message);
    }
  });
}

export default { render };
