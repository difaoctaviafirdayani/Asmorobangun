const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { nanoid } = require("nanoid");

const UPLOADS_ROOT = path.join(__dirname, "..", "uploads");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function makeUploader(subfolder) {
  const dest = path.join(UPLOADS_ROOT, subfolder);
  ensureDir(dest);
  const storage = multer.diskStorage({
    destination: dest,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || "";
      cb(null, `${Date.now()}-${nanoid(8)}${ext}`);
    },
  });
  return multer({
    storage,
    limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
    fileFilter: (req, file, cb) => {
      const allowed = /jpeg|jpg|png|webp|gif|pdf/i;
      if (allowed.test(path.extname(file.originalname))) cb(null, true);
      else cb(new Error("Format file tidak didukung (gunakan JPG/PNG/WEBP/GIF/PDF)."));
    },
  });
}

// Uploader for a raw .zip file (admin bulk image upload). Kept separate from
// makeUploader() because the file filter needs to accept .zip specifically
// and we don't want to rename/move it until we've extracted its contents.
function makeZipUploader() {
  const tmpDir = path.join(UPLOADS_ROOT, "_tmp_zip");
  ensureDir(tmpDir);
  const storage = multer.diskStorage({
    destination: tmpDir,
    filename: (req, file, cb) => cb(null, `${Date.now()}-${nanoid(8)}.zip`),
  });
  return multer({
    storage,
    limits: { fileSize: 40 * 1024 * 1024 }, // 40MB zip
    fileFilter: (req, file, cb) => {
      if (/\.zip$/i.test(file.originalname)) cb(null, true);
      else cb(new Error("File harus berformat .zip"));
    },
  });
}

module.exports = { makeUploader, makeZipUploader, UPLOADS_ROOT, ensureDir };
