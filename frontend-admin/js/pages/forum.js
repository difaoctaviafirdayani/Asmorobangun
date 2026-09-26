import { api, formatDate, escapeHtml, showToast } from "../api.js";

let cats = [];
let filterCat = "";

async function render(el) {
  el.innerHTML = `
    <div class="a-toolbar"><div class="a-filters"><select class="a-select" id="fCat"><option value="">Semua Kategori</option></select></div></div>
    <div id="list">Memuat...</div>
    <div class="a-modal-overlay" id="detailModal"><div class="a-modal" id="detailModalBody"></div></div>
  `;
  const { categories } = await api("/forum/categories");
  cats = categories;
  document.getElementById("fCat").innerHTML += cats.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
  document.getElementById("fCat").addEventListener("change", (e) => {
    filterCat = e.target.value;
    load();
  });
  document.getElementById("detailModal").addEventListener("click", (e) => {
    if (e.target.id === "detailModal") e.target.classList.remove("open");
  });
  await load();
}

async function load() {
  const params = new URLSearchParams();
  if (filterCat) params.set("category", filterCat);
  const { threads } = await api(`/forum?${params.toString()}`);
  document.getElementById("list").innerHTML = threads.length
    ? `<div class="a-card"><div class="a-table-wrap"><table class="a-table">
        <thead><tr><th>Judul</th><th>Kategori</th><th>Penulis</th><th>Balasan</th><th>Tanggal</th><th>Aksi</th></tr></thead>
        <tbody>${threads
          .map(
            (t) => `<tr>
              <td>${escapeHtml(t.title)}</td><td>${escapeHtml(t.category)}</td><td>${escapeHtml(t.userName)}</td><td>${t.replyCount}</td><td>${formatDate(t.date)}</td>
              <td>
                <button class="a-btn a-btn-outline a-btn-sm" data-open="${t.id}">Buka</button>
                <button class="a-btn a-btn-danger a-btn-sm" data-del="${t.id}">Hapus</button>
              </td>
            </tr>`
          )
          .join("")}</tbody>
      </table></div></div>`
    : `<div class="a-empty">Belum ada diskusi di kategori ini.</div>`;

  document.querySelectorAll("[data-open]").forEach((b) => b.addEventListener("click", () => openThread(b.getAttribute("data-open"))));
  document.querySelectorAll("[data-del]").forEach((b) =>
    b.addEventListener("click", async () => {
      if (!confirm("Hapus thread diskusi ini?")) return;
      await api(`/forum/${b.getAttribute("data-del")}`, { method: "DELETE" });
      showToast("Thread dihapus.");
      load();
    })
  );
}

async function openThread(id) {
  const { thread: t } = await api(`/forum/${id}`);
  const modal = document.getElementById("detailModal");
  document.getElementById("detailModalBody").innerHTML = `
    <h3>${escapeHtml(t.title)}</h3>
    <div class="a-field-hint" style="margin-bottom:10px">${escapeHtml(t.userName)} · ${formatDate(t.date)}</div>
    <p style="font-size:0.88rem">${escapeHtml(t.content)}</p>
    <div class="a-chatlog" style="margin-top:10px">
      ${t.replies.length ? t.replies.map((r) => `<div class="bub ${r.userName === "Admin Sanggar" ? "admin" : "buyer"}"><strong>${escapeHtml(r.userName)}:</strong> ${escapeHtml(r.content)}</div>`).join("") : `<div class="a-field-hint">Belum ada balasan.</div>`}
    </div>
    <div style="display:flex;gap:8px">
      <input id="adminForumReply" placeholder="Balas sebagai Admin Sanggar..." style="flex:1;border:1.5px solid var(--line);border-radius:9px;padding:9px 11px" />
      <button class="a-btn a-btn-outline a-btn-sm" id="sendForumReply">Kirim</button>
    </div>
    <button class="a-btn a-btn-ghost" id="closeThread" style="width:100%;justify-content:center;margin-top:14px">Tutup</button>
  `;
  modal.classList.add("open");
  document.getElementById("closeThread").addEventListener("click", () => modal.classList.remove("open"));
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

export default { render };
