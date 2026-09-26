import { api, setAdminSession, showToast } from "../api.js";

async function render(container) {
  container.innerHTML = `
    <div class="a-login-wrap">
      <div class="a-login-card">
        <div class="a-brand-lg">asmorobangun</div>
        <div class="a-sub">Dashboard Admin Sanggar</div>
        <form id="loginForm">
          <div class="a-field"><label>Email</label><input type="email" id="email" required placeholder="admin@asmorobangun.id" /></div>
          <div class="a-field"><label>Password</label><input type="password" id="password" required placeholder="Password" /></div>
          <button class="a-btn a-btn-primary" style="width:100%;justify-content:center;padding:12px" type="submit">Masuk Dashboard</button>
        </form>
        <div style="text-align:center;font-size:0.72rem;color:var(--ink-soft);margin-top:16px">Khusus admin sanggar. Bukan admin? <a href="../frontend-app/index.html" style="color:var(--wood-800);font-weight:700">Kembali ke situs utama</a></div>
      </div>
    </div>`;

  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    try {
      const data = await api("/auth/login", { method: "POST", body: { email, password } });
      if (data.user.role !== "admin") {
        showToast("Akun ini bukan akun admin.");
        return;
      }
      setAdminSession(data.token, data.user);
      location.hash = "#/dashboard";
      location.reload();
    } catch (err) {
      showToast(err.message);
    }
  });
}

export default { render };
