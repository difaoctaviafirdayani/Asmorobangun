const express = require("express");
const fs = require("fs");
const path = require("path");
const { nanoid } = require("nanoid");
const AdmZip = require("adm-zip");
const { readDB, update } = require("../db");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { makeUploader, makeZipUploader, UPLOADS_ROOT, ensureDir } = require("../upload");

const router = express.Router();
const uploadImage = makeUploader("site_images");
const uploadZip = makeZipUploader();

const IMAGE_EXT = /\.(jpe?g|png|webp|gif)$/i;

// All media-library routes are admin-only: this is the "buatin bisa di edit
// gambarnya di zip ya" panel — admins can drop a single image or a whole
// .zip of images in, and every other admin screen (topeng, galeri, artikel)
// picks the final image from this shared library.
router.use(requireAuth, requireAdmin);

// GET /api/uploads/library -- list everything available to pick from
router.get("/library", (req, res) => {
  const db = readDB();
  res.json({ media: [...db.mediaLibrary].sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)) });
});

// POST /api/uploads/image  (multipart field: image) -- single image upload
router.post("/image", uploadImage.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "File gambar wajib diunggah." });
  const url = `/uploads/site_images/${req.file.filename}`;
  const item = {
    id: `media-${nanoid(8)}`,
    name: req.file.originalname,
    url,
    uploadedAt: new Date().toISOString(),
  };
  await update((data) => data.mediaLibrary.push(item));
  res.status(201).json({ item });
});

// POST /api/uploads/zip  (multipart field: zip) -- bulk extract every image
// inside the archive straight into the media library in one go.
router.post("/zip", uploadZip.single("zip"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "File .zip wajib diunggah." });
  const zipPath = req.file.path;
  const destDir = path.join(UPLOADS_ROOT, "site_images");
  ensureDir(destDir);

  let added = [];
  try {
    const zip = new AdmZip(zipPath);
    const entries = zip.getEntries().filter((e) => !e.isDirectory && IMAGE_EXT.test(e.entryName) && !e.entryName.startsWith("__MACOSX"));
    if (!entries.length) {
      return res.status(400).json({ error: "Tidak ada file gambar (JPG/PNG/WEBP/GIF) di dalam .zip tersebut." });
    }
    for (const entry of entries) {
      const baseName = path.basename(entry.entryName).replace(/[^a-zA-Z0-9._-]/g, "_");
      const ext = path.extname(baseName) || ".jpg";
      const savedName = `${Date.now()}-${nanoid(6)}${ext}`;
      fs.writeFileSync(path.join(destDir, savedName), entry.getData());
      added.push({
        id: `media-${nanoid(8)}`,
        name: baseName,
        url: `/uploads/site_images/${savedName}`,
        uploadedAt: new Date().toISOString(),
      });
    }
    await update((data) => data.mediaLibrary.push(...added));
    res.status(201).json({ items: added, count: added.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal memproses file .zip. Pastikan file tidak rusak." });
  } finally {
    fs.unlink(zipPath, () => {});
  }
});

// DELETE /api/uploads/library/:id
router.delete("/library/:id", async (req, res) => {
  await update((data) => {
    data.mediaLibrary = data.mediaLibrary.filter((m) => m.id !== req.params.id);
  });
  res.json({ message: "Gambar dihapus dari pustaka media." });
});

module.exports = router;
