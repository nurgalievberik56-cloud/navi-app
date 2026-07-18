import express, { Router } from "express";
import { eq, sql } from "drizzle-orm";
import { getDb } from "./db";
import { naviStore } from "../drizzle/schema";
import crypto from "crypto";

const ALLOWED_KEYS = [
  "navi_ads",
  "navi_bizs",
  "navi_prods",
  "navi_feed",
  "navi_reviews",
  "navi_orders",
  "navi_bookings",
  "navi_payment_requests",
  "navi_reports",
  "navi_prices",
  "navi_announcements",
];

export function registerNaviStoreRoutes(app: express.Express) {
  const router = Router();

  // ─── Business Auth ────────────────────────────────────────────────────────
  // GET /api/navi/auth/:phone — check if phone is registered
  router.get("/navi/auth/:phone", async (req, res) => {
    try {
      const phone = req.params.phone?.replace(/[^\d]/g, "") || "";
      const db = await getDb();
      if (!db) { res.json({ exists: false }); return; }
      // Check in navi_store: navi_bizs key contains businesses with phone
      const row = await db.select().from(naviStore).where(eq(naviStore.key, "navi_bizs")).limit(1);
      if (row.length && row[0].value) {
        const bizs = JSON.parse(row[0].value) as Array<{ phone?: string }>;
        const exists = bizs.some(b => (b.phone || "").replace(/[^\d]/g, "") === phone);
        res.json({ exists });
      } else {
        res.json({ exists: false });
      }
    } catch (e) {
      console.error("[naviStore] auth check error:", e);
      res.json({ exists: false });
    }
  });

  // POST /api/navi/auth — create or verify PIN for business owner
  router.post("/navi/auth", async (req, res) => {
    try {
      const { phone, pin, action } = req.body as { phone: string; pin: string; action: "create" | "verify" };
      const cleanPhone = (phone || "").replace(/[^\d]/g, "");
      const db = await getDb();
      if (!db) { res.json({ ok: true }); return; }

      // Store pins in a dedicated navi_store key: navi_pins = { [phone]: hashedPin }
      const pinsRow = await db.select().from(naviStore).where(eq(naviStore.key, "navi_pins")).limit(1);
      const pins: Record<string, string> = pinsRow.length && pinsRow[0].value
        ? JSON.parse(pinsRow[0].value)
        : {};

      const hashPin = (p: string) => crypto.createHash("sha256").update(p + cleanPhone).digest("hex");

      if (action === "create") {
        pins[cleanPhone] = hashPin(pin);
        const value = JSON.stringify(pins);
        await db.insert(naviStore).values({ key: "navi_pins", value })
          .onDuplicateKeyUpdate({ set: { value } });
        res.json({ ok: true });
      } else if (action === "verify") {
        const stored = pins[cleanPhone];
        if (!stored) { res.json({ ok: false }); return; }
        const ok = stored === hashPin(pin);
        res.json({ ok });
      } else {
        res.status(400).json({ error: "Unknown action" });
      }
    } catch (e) {
      console.error("[naviStore] auth error:", e);
      res.status(500).json({ error: "Auth failed" });
    }
  });

  // GET /api/navi/init — returns all store keys as a single JSON object
  router.get("/navi/init", async (_req, res) => {
    try {
      const db = await getDb();
      if (!db) {
        res.json({});
        return;
      }
      const rows = await db.select().from(naviStore);
      const result: Record<string, unknown> = {};
      for (const row of rows) {
        if (ALLOWED_KEYS.includes(row.key) && row.value) {
          try {
            result[row.key] = JSON.parse(row.value);
          } catch {
            result[row.key] = row.value;
          }
        }
      }
      res.json(result);
    } catch (e) {
      console.error("[naviStore] init error:", e);
      res.json({});
    }
  });

  // PUT /api/navi/store/:key — upsert a store key
  router.put("/navi/store/:key", async (req, res) => {
    const key = decodeURIComponent(req.params.key || "");
    if (!ALLOWED_KEYS.includes(key)) {
      res.status(400).json({ error: "Key not allowed" });
      return;
    }
    try {
      const db = await getDb();
      if (!db) {
        res.json({ ok: true });
        return;
      }
      const value = JSON.stringify(req.body?.value ?? req.body);
      await db
        .insert(naviStore)
        .values({ key, value })
        .onDuplicateKeyUpdate({ set: { value } });
      res.json({ ok: true });
    } catch (e) {
      console.error("[naviStore] store error:", e);
      res.status(500).json({ error: "Store failed" });
    }
  });

  app.use("/api", router);
}
