import { api, formatDate, escapeHtml, showToast } from "../api.js";
import { actionCell, openModal, closeModal } from "../ui.js";

let cats = [];
let filterCat = "";
let threads = [];

async function render(el) {
  el.innerHTML = `
    <div class="a-toolbar"><div class="a-filters"><select class="a-select" id="fCat"><option value="">Semua Kategori</option></select></div></div>
    <div id="list">Memuat...</div>`;
  const { categories } = await api("/forum/categories");
  cats = categories;
  document.getElementById("fCat").innerHTML += cats.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
  document.getElementById("fCat").addEventListener("change", (e) => {
    filterCat = e.target.value;
    load();
  });
  await load();
}

async function load() {
  const params = new URLSearchParams();
  if (filterCat) params.set("category", filterCat);
  ({ threads } = await api(`/forum?${params.toString()}`));
  document.getElementById("list").innerHTML = threads.length
    ? `<div class="a-card"><div class="a-table-wrap"><table class="a-table a-compact">
        <thead><tr><th>Judul</th><th>Kategori</th><th>Penulis</th><th>Balasan</th><th>Tanggal</th><th>Aksi</th></tr></thead>
        <tbody>${threads
          .map(
            (t) => `<tr>
              <td>${escapeHtml(t.title)}</td><td>${escapeHtml(t.category)}</td><td>${escapeHtml(t.userName)}</td><td>${t.replyCount}</td><td>${formatDate(t.date)}</td>
              <td>${actionCell(t.id)}</td>
            </tr>`
          )
          .join("")}</tbody>
      </table></div></div>`
    : `<div class="a-empty">Belum ada diskusi di kategori ini.</div>`;

  document.querySelectorAll("[data-detail]").forEach((b) => b.addEventListener("click", () => openThread(b.getAttribute("data-detail"))));
  document.querySelectorAll("[data-edit]").forEach((b) => b.addEventListener("click", () => openEdit(b.getAttribute("data-edit"))));
}

/* ---------- DETAIL: isi diskusi + balasan ---------- */
async function openThread(id) {
  const { thread: t } = await api(`/forum/${id}`);
  openModal(`
    <h3>${escapeHtml(t.title)}</h3>
    <div class="a-field-hint" style="margin-bottom:10px">${escapeHtml(t.category)} · ${escapeHtml(t.userName)} · ${formatDate(t.date)}</div>
    <p style="font-size:0.88rem;white-space:pre-wrap">${escapeHtml(t.content)}</p>
    <div class="a-chatlog" style="margin-top:10px">
      ${t.replies.length ? t.replies.map((r) => `<div class="bub ${r.userName === "Admin Sanggar" ? "admin" : "buyer"}"><strong>${escapeHtml(r.userName)}:</strong> ${escapeHtml(r.content)}</div>`).join("") : `<div class="a-field-hint">Belum ada balasan.</div>`}
    </div>
    <div style="display:flex;gap:8px">
      <input id="adminForumReply" placeholder="Balas sebagai Admin Sanggar..." style="flex:1;border:1.5px solid var(--line);border-radius:9px;padding:9px 11px" />
      <button class="a-btn a-btn-outline a-btn-sm" id="sendForumReply">Kirim</button>
    </div>
    <div class="a-modal-foot"><button class="a-btn a-btn-ghost" id="closeBtn">Tutup</button></div>
  `);
  document.getElementById("closeBtn").addEventListener("click", closeModal);
  document.getElementById("sendForumReply").addEventListener("click", async () => {
    const content = document.getElementById("adminForumReply").value.trim();
    if (!content) return;
    try {
      await api(`/forum/${id}/replies`, { method: "POST", body: { content } });
      openThread(id);
      load();
    } catch (err) {
      showToast(err.message);
    }
  });
}

/* ---------- EDIT: moderasi judul / kategori / isi + tombol Hapus ---------- */
async function openEdit(id) {
  const { thread: t } = await api(`/forum/${id}`);
  const catList = cats.includes(t.category) ? cats : [...cats, t.category];
  const body = openModal(`
    <h3>Edit Diskusi</h3>
    <form id="fForm">
      <div class="a-field"><label>Judul</label><input name="title" required value="${escapeHtml(t.title)}" /></div>
      <div class="a-field"><label>Kategori</label>
        <select name="category">${catList.map((c) => `<option ${c === t.category ? "selected" : ""}>${escapeHtml(c)}</option>`).join("")}</select>
      </div>
      <div class="a-field"><label>Isi diskusi</label><textarea name="content" rows="5" required>${escapeHtml(t.content)}</textarea></div>
      <div class="a-modal-foot">
        <button type="button" class="a-btn a-btn-danger" id="delBtn">Hapus</button>
        <button type="button" class="a-btn a-btn-ghost" id="cancelBtn">Batal</button>
        <button type="submit" class="a-btn a-btn-primary">Simpan</button>
      </div>
    </form>`);
  document.getElementById("cancelBtn").addEventListener("click", closeModal);
  document.getElementById("delBtn").addEventListener("click", async () => {
    if (!confirm("Hapus thread diskusi ini?")) return;
    try {
      await api(`/forum/${id}`, { method: "DELETE" });
      showToast("Thread dihapus.");
      closeModal();
      load();
    } catch (err) {
      showToast(err.message);
    }
  });
  body.querySelector("#fForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(e.target).entries());
    try {
      await api(`/forum/${id}`, { method: "PATCH", body: payload });
      showToast("Diskusi diperbarui.");
      closeModal();
      load();
    } catch (err) {
      showToast(err.message);
    }
  });
}

export default { render };
