import type { Express } from "express";
import multer from "multer";
import { storagePut } from "./storage";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

export function registerFeedUploadRoute(app: Express) {
  app.post(
    "/api/feed/upload",
    upload.single("file"),
    async (req, res) => {
      try {
        if (!req.file) {
          res.status(400).json({ error: "No file provided" });
          return;
        }
        const { originalname, mimetype, buffer } = req.file;
        const ext = originalname.split(".").pop() || "bin";
        const key = `feed/${Date.now()}.${ext}`;
        const result = await storagePut(key, buffer, mimetype);
        res.json({ url: result.url, key: result.key });
      } catch (err: any) {
        console.error("[feed/upload]", err);
        res.status(500).json({ error: err.message || "Upload failed" });
      }
    }
  );
}
