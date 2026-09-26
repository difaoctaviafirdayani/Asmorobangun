import { api, setSession, showToast } from "../api.js";

async function render(container) {
  container.innerHTML = `
    <div class="auth-hero">
      <div class="wordmark">asmorobangun</div>
      <div class="tagline">Sanggar Wayang Topeng Malangan · Pakisaji</div>
    </div>
    <div class="auth-body">
      <h2>Masuk</h2>
      <p style="color:var(--ink-soft);font-size:0.88rem">Masuk untuk mendaftar kelas, memesan topeng, dan mengikuti forum diskusi.</p>
      <form id="loginForm">
        <div class="field">
          <label>Email</label>
          <input type="email" id="email" required placeholder="nama@email.com" />
        </div>
        <div class="field">
          <label>Password</label>
          <input type="password" id="password" required placeholder="Password" />
        </div>
        <button class="btn btn-primary" type="submit">Masuk</button>
      </form>
      <p class="auth-switch">Belum punya akun? <a href="#/register">Daftar sekarang</a></p>
      <p class="auth-switch" style="margin-top:24px;font-size:0.72rem">Admin sanggar? <a href="../frontend-admin/index.html">Masuk ke dashboard admin</a></p>
    </div>
  `;

  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    try {
      const data = await api("/auth/login", { method: "POST", body: { email, password } });
      setSession(data.token, data.user);
      const redirect = localStorage.getItem("asmoro_redirect_after_login");
      localStorage.removeItem("asmoro_redirect_after_login");
      location.hash = redirect || "#/";
    } catch (err) {
      showToast(err.message);
    }
  });
}

export default { nav: "profile", render };
