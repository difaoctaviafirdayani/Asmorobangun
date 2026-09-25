require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./src/routes/auth.routes");
const articlesRoutes = require("./src/routes/articles.routes");
const facilitiesRoutes = require("./src/routes/facilities.routes");
const bookingsRoutes = require("./src/routes/bookings.routes");
const topengRoutes = require("./src/routes/topeng.routes");
const forumRoutes = require("./src/routes/forum.routes");
const announcementsRoutes = require("./src/routes/announcements.routes");
const searchRoutes = require("./src/routes/search.routes");
const aiRoutes = require("./src/routes/ai.routes");
const galleryRoutes = require("./src/routes/gallery.routes");
const cultureRoutes = require("./src/routes/culture.routes");
const adminRoutes = require("./src/routes/admin.routes");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files (payment proofs, etc.)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// This server is a pure JSON API. There are two separate static frontends:
//   frontend-app/   -> user-facing app (mobile-first)
//   frontend-admin/ -> admin dashboard (desktop web)
// Serve them too, each on its own path, so the whole project still runs
// with a single `npm start` if you don't want to run separate static servers.
app.use("/app", express.static(path.join(__dirname, "..", "frontend-app")));
app.use("/admin", express.static(path.join(__dirname, "..", "frontend-admin")));

app.use("/api/auth", authRoutes);
app.use("/api/articles", articlesRoutes);
app.use("/api/facilities", facilitiesRoutes);
app.use("/api/bookings", bookingsRoutes);
app.use("/api/topeng", topengRoutes);
app.use("/api/forum", forumRoutes);
app.use("/api/announcements", announcementsRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/culture", cultureRoutes);
app.use("/api/admin", adminRoutes);

app.get("/api/health", (req, res) => res.json({ ok: true, name: "Asmorobangun API" }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Terjadi kesalahan pada server." });
});

app.listen(PORT, () => {
  console.log(`Asmorobangun backend running on http://localhost:${PORT}`);
});
