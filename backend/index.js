const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const os = require("os");
const path = require("path");
require("dotenv").config();

const { ObjectId, GridFSBucket } = mongoose.mongo;
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const mongoURI = process.env.MONGO_URI;
if (!mongoURI) {
  console.error("❌ MONGO_URI is required.");
  process.exit(1);
}

let bucket;
const files = () => mongoose.connection.db.collection("videos.files");

mongoose
  .connect(mongoURI)
  .then(() => {
    bucket = new GridFSBucket(mongoose.connection.db, { bucketName: "videos" });
    console.log("📦 MongoDB GridFS ready");
  })
  .catch((e) => { console.error("❌ MongoDB connection error:", e.message); process.exit(1); });

// Uploads go to the OS temp dir first, then into GridFS (temp file is always removed)
const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 2 * 1024 ** 3 },
  fileFilter: (_, f, cb) => cb(null, f.mimetype.startsWith("video/")),
});

const shape = (f) => ({
  id: f._id,
  title: f.metadata?.title || path.parse(f.filename).name,
  description: f.metadata?.description || "",
  filename: f.filename,
  size: f.length,
  views: f.metadata?.views || 0,
  likes: f.metadata?.likes || 0,
  createdAt: f.uploadDate,
});
const validId = (req, res, next) =>
  ObjectId.isValid(req.params.id) ? next() : res.status(400).json({ error: "Invalid id" });

app.get("/health", (_, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({ status: connected ? "ok" : "starting" });
});

// List (newest first)
app.get("/videos", async (_, res) => {
  const list = await files().find().sort({ uploadDate: -1 }).toArray();
  res.json(list.map(shape));
});

// Single video
app.get("/videos/:id", validId, async (req, res) => {
  const f = await files().findOne({ _id: new ObjectId(req.params.id) });
  f ? res.json(shape(f)) : res.sendStatus(404);
});

// Views / likes counters
const bump = (field) => async (req, res) => {
  const n = field === "likes" ? Math.sign(Number(req.body?.delta)) || 1 : 1;
  await files().updateOne({ _id: new ObjectId(req.params.id) }, { $inc: { [`metadata.${field}`]: n } });
  res.sendStatus(204);
};
app.post("/videos/:id/view", validId, bump("views"));
app.post("/videos/:id/like", validId, bump("likes"));

// Delete
app.delete("/videos/:id", validId, async (req, res) => {
  try { await bucket.delete(new ObjectId(req.params.id)); res.sendStatus(204); }
  catch { res.sendStatus(404); }
});

// Upload (multipart: file, title, description)
app.post("/upload", upload.single("file"), (req, res) => {
  const f = req.file;
  if (!f) return res.status(400).json({ error: "Please upload a video file." });
  const { title = "", description = "" } = req.body;
  const out = bucket.openUploadStream(f.originalname, {
    metadata: {
      title: title.trim().slice(0, 120) || path.parse(f.originalname).name,
      description: description.slice(0, 2000),
      contentType: f.mimetype,
      views: 0,
      likes: 0,
    },
  });
  const cleanup = () => fs.unlink(f.path, () => {});
  fs.createReadStream(f.path)
    .pipe(out)
    .on("error", () => { cleanup(); res.status(500).json({ error: "Upload failed." }); })
    .on("finish", () => { cleanup(); res.status(201).json({ id: out.id }); });
});

// Stream with HTTP range support
app.get("/video/:id", validId, async (req, res) => {
  const id = new ObjectId(req.params.id);
  const f = await files().findOne({ _id: id });
  if (!f || !f.length) return res.sendStatus(404);

  const size = f.length;
  const type = f.metadata?.contentType || "video/mp4";
  const range = req.headers.range;

  if (!range) {
    res.writeHead(200, { "Content-Length": size, "Content-Type": type, "Accept-Ranges": "bytes" });
    return bucket.openDownloadStream(id).pipe(res);
  }

  const [a, b] = range.replace(/bytes=/, "").split("-");
  let start = parseInt(a, 10);
  let end = b ? parseInt(b, 10) : size - 1;
  if (isNaN(start)) { start = size - end; end = size - 1; } // "bytes=-500"
  end = Math.min(end, size - 1);
  if (isNaN(end) || start < 0 || start > end) {
    res.writeHead(416, { "Content-Range": `bytes */${size}` });
    return res.end();
  }

  res.writeHead(206, {
    "Content-Range": `bytes ${start}-${end}/${size}`,
    "Accept-Ranges": "bytes",
    "Content-Length": end - start + 1,
    "Content-Type": type,
  });
  const stream = bucket.openDownloadStream(id, { start, end: end + 1 }); // end is exclusive
  stream.on("error", () => res.destroy());
  res.on("close", () => stream.destroy());
  stream.pipe(res);
});

app.use((err, req, res, next) => res.status(400).json({ error: err.message }));
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
