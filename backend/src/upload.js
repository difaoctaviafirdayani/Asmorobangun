const multer = require("multer");
const path = require("path");
const { nanoid } = require("nanoid");

function makeUploader(subfolder) {
  const storage = multer.diskStorage({
    destination: path.join(__dirname, "..", "uploads", subfolder),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || "";
      cb(null, `${Date.now()}-${nanoid(8)}${ext}`);
    },
  });
  return multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
      const allowed = /jpeg|jpg|png|webp|pdf/i;
      if (allowed.test(path.extname(file.originalname))) cb(null, true);
      else cb(new Error("Format file tidak didukung (gunakan JPG/PNG/PDF)."));
    },
  });
}

module.exports = { makeUploader };
