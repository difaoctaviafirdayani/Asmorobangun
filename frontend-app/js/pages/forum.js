import { api, requireLoginOrRedirect, escapeHtml, formatDate, showToast } from "../api.js";

let activeCat = "";

async function render(container) {
  container.innerHTML = `
    <div class="topbar">
      <div class="topbar-row">
        <button class="icon-btn" data-nav="#/">←</button>
        <div class="wordmark" style="font-size:1.05rem">Forum Diskusi</div>
        <button class="icon-btn" data-open-search>🔍</button>
      </div>
    </div>
    <div class="section" style="display:flex;gap:8px;overflow-x:auto" id="catRow"></div>
    <div class="section" id="threadList">Memuat...</div>

    <button class="new-thread-fab" id="newThreadFab">✏️ Diskusi Baru</button>

    <div class="sheet-overlay" id="ntSheet">
      <div class="sheet-card">
        <h3>Mulai diskusi baru</h3>
        <div class="field"><label>Kategori</label>
          <select id="ntCategory"><option>Diskusi Umum</option><option>Kelas Tari</option><option>Karawitan</option><option>Topeng</option><option>Acara & Booking</option></select>
        </div>
        <div class="field"><label>Judul</label><input id="ntTitle" placeholder="Judul diskusi"/></div>
        <div class="field"><label>Isi</label><textarea id="ntContent" rows="3" placeholder="Tulis pertanyaan atau cerita kamu..."></textarea></div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-ghost" id="ntCancel">Batal</button>
          <button class="btn btn-primary" id="ntSubmit">Kirim</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById("newThreadFab").addEventListener("click", openNewThread);
  document.getElementById("ntCancel").addEventListener("click", closeNewThread);
  document.getElementById("ntSubmit").addEventListener("click", submitThread);
  document.getElementById("ntSheet").addEventListener("click", (e) => {
    if (e.target.id === "ntSheet") closeNewThread();
  });

  await loadCats();
  await loadThreads();
}

async function loadCats() {
  const { categories } = await api("/forum/categories");
  const row = document.getElementById("catRow");
  const chip = (label, val) =>
    `<button class="tag" data-cat="${val}" style="background:${val === activeCat ? "var(--wood-800)" : "var(--cream-300)"};color:${val === activeCat ? "#fff" : "var(--wood-900)"};border:none;white-space:nowrap">${escapeHtml(label)}</button>`;
  row.innerHTML = chip("Semua", "") + categories.map((c) => chip(c, c)).join("");
  row.querySelectorAll("[data-cat]").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeCat = btn.getAttribute("data-cat");
      loadCats();
      loadThreads();
    });
  });
}

async function loadThreads() {
  const params = new URLSearchParams();
  if (activeCat) params.set("category", activeCat);
  const { threads } = await api(`/forum?${params.toString()}`);
  document.getElementById("threadList").innerHTML = threads.length
    ? threads
        .map(
          (t) => `<a class="thread-item" style="display:block" href="#/forum/${t.id}">
            <div class="th-cat">${escapeHtml(t.category)}</div>
            <div class="th-title">${escapeHtml(t.title)}</div>
            <div class="th-meta">${escapeHtml(t.userName)} · ${formatDate(t.date)} · 💬 ${t.replyCount} balasan</div>
          </a>`
        )
        .join("")
    : `<div class="empty-state"><div class="e-icon">💬</div>Belum ada diskusi. Jadilah yang pertama!</div>`;
}

function openNewThread() {
  if (!requireLoginOrRedirect()) return;
  document.getElementById("ntSheet").classList.add("open");
}
function closeNewThread() {
  document.getElementById("ntSheet").classList.remove("open");
}

async function submitThread() {
  const title = document.getElementById("ntTitle").value.trim();
  const content = document.getElementById("ntContent").value.trim();
  const category = document.getElementById("ntCategory").value;
  if (!title || !content) return showToast("Judul dan isi wajib diisi.");
  try {
    const { thread } = await api("/forum", { method: "POST", auth: true, body: { title, content, category } });
    closeNewThread();
    location.hash = `#/forum/${thread.id}`;
  } catch (err) {
    showToast(err.message);
  }
}

export default { nav: "forum", render };
