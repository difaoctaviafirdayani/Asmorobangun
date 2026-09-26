import { api, isLoggedIn, escapeHtml, formatDate, showToast } from "../api.js";

async function render(container, { id: thid }) {
  container.innerHTML = `
    <div class="back-row"><button class="back-btn" data-nav="#/forum">←</button></div>
    <div id="content" class="section">Memuat...</div>
  `;
  await load(thid);
}

async function load(thid) {
  const content = document.getElementById("content");
  try {
    const { thread: t } = await api(`/forum/${thid}`);
    content.innerHTML = `
      <div class="th-cat">${escapeHtml(t.category)}</div>
      <h2 style="margin-top:6px">${escapeHtml(t.title)}</h2>
      <div class="th-meta">${escapeHtml(t.userName)} · ${formatDate(t.date)}</div>
      <p style="margin-top:12px">${escapeHtml(t.content)}</p>

      <div class="section-head" style="margin-top:16px"><h3 style="font-size:0.95rem">${t.replies.length} Balasan</h3></div>
      <div id="replies">
        ${
          t.replies
            .map(
              (r) => `<div class="reply-bubble ${r.userName === "Admin Sanggar" ? "admin" : ""}">
            <div class="rb-name">${escapeHtml(r.userName)}${r.userName === "Admin Sanggar" ? " · Admin" : ""}</div>
            <div>${escapeHtml(r.content)}</div>
            <div class="th-meta" style="margin-top:4px">${formatDate(r.date)}</div>
          </div>`
            )
            .join("") || `<div class="empty-state">Belum ada balasan.</div>`
        }
      </div>

      <div class="field" style="margin-top:14px">
        ${
          isLoggedIn()
            ? `<textarea id="replyInput" rows="2" placeholder="Tulis balasan..."></textarea>
               <button class="btn btn-primary" style="margin-top:8px" id="replySendBtn">Kirim Balasan</button>`
            : `<div class="card card-pad"><a href="#/login">Masuk</a> untuk membalas diskusi ini.</div>`
        }
      </div>
    `;
    const btn = document.getElementById("replySendBtn");
    if (btn) btn.addEventListener("click", () => sendReply(thid));
  } catch (err) {
    content.innerHTML = `<div class="empty-state">Diskusi tidak ditemukan.</div>`;
  }
}

async function sendReply(thid) {
  const content = document.getElementById("replyInput").value.trim();
  if (!content) return;
  try {
    await api(`/forum/${thid}/replies`, { method: "POST", auth: true, body: { content } });
    load(thid);
  } catch (err) {
    showToast(err.message);
  }
}

export default { nav: "forum", render };
