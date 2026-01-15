import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);


const uploadsDir = path.resolve("uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

app.use("/uploads", express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const safeOriginal = (file.originalname || "file").replace(/\s+/g, "_");
    const ext = path.extname(safeOriginal) || "";
    const base = path.basename(safeOriginal, ext);
    const unique = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    cb(null, `${base}-${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype?.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  const url = `http://localhost:${PORT}/uploads/${req.file.filename}`;
  res.json({ url });
});

app.get("/api/health", (req, res) => res.json({ ok: true }));


app.use((err, req, res, next) => {
  const msg = err?.message || "Server error";
  const status = msg.includes("File too large") ? 413 : 400;
  res.status(status).json({ message: msg });
});

app.listen(PORT, () => {
  console.log(`✅ Upload server running on http://localhost:${PORT}`);
  console.log(`📁 Static: http://localhost:${PORT}/uploads/<file>`);
});
