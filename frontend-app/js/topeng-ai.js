import { api, escapeHtml } from "./api.js";

let mounted = false;

export function mountTopengAI() {
  if (mounted) return;
  mounted = true;

  const shell = document.querySelector(".app-shell");
  const fab = document.createElement("button");
  fab.className = "ai-fab";
  fab.id = "topengAiFab";
  fab.innerHTML = "🎭";
  fab.title = "Tanya Asisten Topeng";
  fab.addEventListener("click", openAI);
  shell.appendChild(fab);

  const panel = document.createElement("div");
  panel.className = "ai-panel";
  panel.id = "topengAiPanel";
  panel.innerHTML = `
    <div class="ai-sheet">
      <div class="ai-sheet-head">
        <div style="font-size:1.3rem">🎭</div>
        <div style="flex:1">
          <div style="font-weight:700;font-size:0.92rem">Asisten Topeng</div>
          <div style="font-size:0.7rem;opacity:0.75">Tanya apapun soal Topeng Malangan — tanpa batas</div>
        </div>
        <button class="icon-btn" id="closeAiBtn">✕</button>
      </div>
      <div class="ai-sheet-body" id="aiMessages">
        <div class="chat-bubble admin">Halo! Aku Asisten Topeng 🎭 — tanya apa saja soal Topeng Malangan: sejarah, tokoh &amp; watak, bahan, cara merawat, sampai katalog yang dijual di sini.</div>
      </div>
      <div class="ai-sheet-foot">
        <input id="aiInput" placeholder="Tulis pertanyaan tentang topeng..." />
        <button class="btn btn-primary btn-sm" id="aiSendBtn">Kirim</button>
      </div>
    </div>`;
  document.body.appendChild(panel);

  panel.addEventListener("click", (e) => {
    if (e.target === panel) closeAI();
  });
  document.getElementById("closeAiBtn").addEventListener("click", closeAI);
  document.getElementById("aiSendBtn").addEventListener("click", sendAI);
  document.getElementById("aiInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendAI();
  });
}

export function unmountTopengAI() {
  if (!mounted) return;
  mounted = false;
  document.getElementById("topengAiFab")?.remove();
  document.getElementById("topengAiPanel")?.remove();
}

function openAI() {
  document.getElementById("topengAiPanel").classList.add("open");
}
function closeAI() {
  document.getElementById("topengAiPanel").classList.remove("open");
}

async function sendAI() {
  const input = document.getElementById("aiInput");
  const msg = input.value.trim();
  if (!msg) return;
  const box = document.getElementById("aiMessages");
  box.insertAdjacentHTML("beforeend", `<div class="chat-bubble buyer">${escapeHtml(msg)}</div>`);
  input.value = "";
  box.scrollTop = box.scrollHeight;
  box.insertAdjacentHTML("beforeend", `<div class="chat-bubble admin" id="aiTyping">Mengetik...</div>`);
  box.scrollTop = box.scrollHeight;
  try {
    const data = await api("/ai/chat", { method: "POST", body: { message: msg } });
    document.getElementById("aiTyping").outerHTML = `<div class="chat-bubble admin">${escapeHtml(data.reply)}</div>`;
  } catch (err) {
    document.getElementById("aiTyping").outerHTML = `<div class="chat-bubble admin">Maaf, asisten sedang gangguan. Coba lagi ya.</div>`;
  }
  box.scrollTop = box.scrollHeight;
}
