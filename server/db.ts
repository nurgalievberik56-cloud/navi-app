import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  ads,
  announcements,
  appSettings,
  bookings,
  businesses,
  feedPosts,
  feedReactions,
  orders,
  paymentRequests,
  products,
  reports,
  reviews,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  for (const field of ["name", "email", "loginMethod"] as const) {
    const v = user[field];
    if (v !== undefined) { values[field] = v ?? null; updateSet[field] = v ?? null; }
  }
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

// ─── Ads ──────────────────────────────────────────────────────────────────────
export async function listAds(category?: string, search?: string) {
  const db = await getDb();
  if (!db) return [];
  let result = await db.select().from(ads).where(eq(ads.isActive, true)).orderBy(desc(ads.createdAt)).limit(100);
  if (category && category !== "all") result = result.filter(a => a.category === category);
  if (search) {
    const s = search.toLowerCase();
    result = result.filter(a => a.title.toLowerCase().includes(s) || (a.description || "").toLowerCase().includes(s));
  }
  return result;
}

export async function createAd(data: typeof ads.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(ads).values(data);
  return (result as { insertId: number }).insertId;
}

export async function deleteAd(id: number, deviceId: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(ads).set({ isActive: false }).where(and(eq(ads.id, id), eq(ads.deviceId, deviceId)));
}

// ─── Businesses ───────────────────────────────────────────────────────────────
export async function listBusinesses(category?: string, search?: string) {
  const db = await getDb();
  if (!db) return [];
  let result = await db.select().from(businesses).where(eq(businesses.isActive, true)).orderBy(desc(businesses.createdAt)).limit(100);
  if (category && category !== "all") result = result.filter(b => b.category === category);
  if (search) {
    const s = search.toLowerCase();
    result = result.filter(b => b.name.toLowerCase().includes(s) || (b.description || "").toLowerCase().includes(s));
  }
  return result;
}

export async function getBusinessById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(businesses).where(eq(businesses.id, id)).limit(1);
  return result[0];
}

export async function getBusinessByDeviceId(deviceId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(businesses).where(and(eq(businesses.deviceId, deviceId), eq(businesses.isActive, true))).limit(1);
  return result[0];
}

export async function createBusiness(data: typeof businesses.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(businesses).values(data);
  return (result as { insertId: number }).insertId;
}

export async function updateBusiness(id: number, deviceId: string, data: Partial<typeof businesses.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(businesses).set(data).where(and(eq(businesses.id, id), eq(businesses.deviceId, deviceId)));
}

// ─── Products ─────────────────────────────────────────────────────────────────
export async function listProducts(businessId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(and(eq(products.businessId, businessId), eq(products.isActive, true))).orderBy(products.createdAt);
}

export async function createProduct(data: typeof products.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(products).values(data);
  return (result as { insertId: number }).insertId;
}

export async function deleteProduct(id: number, businessId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(products).set({ isActive: false }).where(and(eq(products.id, id), eq(products.businessId, businessId)));
}

// ─── Orders ───────────────────────────────────────────────────────────────────
export async function listOrdersForBusiness(businessId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).where(eq(orders.businessId, businessId)).orderBy(desc(orders.createdAt)).limit(200);
}

export async function listOrdersByDevice(deviceId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).where(eq(orders.deviceId, deviceId)).orderBy(desc(orders.createdAt)).limit(50);
}

export async function createOrder(data: typeof orders.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(orders).values(data);
  return (result as { insertId: number }).insertId;
}

export async function updateOrderStatus(id: number, businessId: number, status: "new" | "confirmed" | "ready" | "done" | "cancelled") {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(orders).set({ status }).where(and(eq(orders.id, id), eq(orders.businessId, businessId)));
}

// ─── Bookings ─────────────────────────────────────────────────────────────────
export async function listBookingsForBusiness(businessId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bookings).where(eq(bookings.businessId, businessId)).orderBy(desc(bookings.createdAt)).limit(200);
}

export async function listBookingsByDevice(deviceId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bookings).where(eq(bookings.deviceId, deviceId)).orderBy(desc(bookings.createdAt)).limit(50);
}

export async function createBooking(data: typeof bookings.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(bookings).values(data);
  return (result as { insertId: number }).insertId;
}

export async function updateBookingStatus(id: number, businessId: number, status: "new" | "confirmed" | "done" | "cancelled") {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(bookings).set({ status }).where(and(eq(bookings.id, id), eq(bookings.businessId, businessId)));
}

// ─── Reviews ──────────────────────────────────────────────────────────────────
export async function listReviews(businessId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reviews).where(eq(reviews.businessId, businessId)).orderBy(desc(reviews.createdAt)).limit(50);
}

export async function createReview(data: typeof reviews.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(reviews).values(data);
  const all = await db.select().from(reviews).where(eq(reviews.businessId, data.businessId!));
  const avg = all.reduce((s, r) => s + r.rating, 0) / all.length;
  await db.update(businesses).set({ rating: avg.toFixed(2), reviewCount: all.length }).where(eq(businesses.id, data.businessId!));
}

// ─── Feed ─────────────────────────────────────────────────────────────────────
export async function listFeedPosts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(feedPosts).where(eq(feedPosts.isActive, true)).orderBy(desc(feedPosts.createdAt)).limit(50);
}

export async function listFeedPostsWithReactions() {
  const db = await getDb();
  if (!db) return [];
  const posts = await db.select().from(feedPosts).where(eq(feedPosts.isActive, true)).orderBy(desc(feedPosts.createdAt)).limit(100);
  if (posts.length === 0) return [];
  const reactions = await db.select().from(feedReactions);
  return posts.map(post => {
    const postReactions = reactions.filter(r => r.postId === post.id);
    const counts: Record<string, number> = { "👍": 0, "❤️": 0, "👏": 0, "😮": 0 };
    for (const r of postReactions) {
      if (counts[r.emoji] !== undefined) counts[r.emoji]++;
      else counts[r.emoji] = 1;
    }
    return { ...post, reactions: counts };
  });
}

export async function deleteFeedPost(id: number, deviceId: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(feedPosts)
    .set({ isActive: false })
    .where(and(eq(feedPosts.id, id), eq(feedPosts.deviceId, deviceId)));
  return { success: true };
}

export async function createFeedPost(data: typeof feedPosts.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(feedPosts).values(data);
  return (result as { insertId: number }).insertId;
}

export async function listReactionsForPost(postId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(feedReactions).where(eq(feedReactions.postId, postId));
}

export async function toggleReaction(postId: number, deviceId: string, emoji: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await db.select().from(feedReactions).where(
    and(eq(feedReactions.postId, postId), eq(feedReactions.deviceId, deviceId), eq(feedReactions.emoji, emoji))
  ).limit(1);
  if (existing.length > 0) {
    await db.delete(feedReactions).where(eq(feedReactions.id, existing[0].id));
    return false;
  } else {
    await db.insert(feedReactions).values({ postId, deviceId, emoji });
    return true;
  }
}

// ─── Payment Requests ─────────────────────────────────────────────────────────
export async function listPaymentRequests() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(paymentRequests).orderBy(desc(paymentRequests.createdAt)).limit(200);
}

export async function createPaymentRequest(data: typeof paymentRequests.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(paymentRequests).values(data);
  return (result as { insertId: number }).insertId;
}

export async function updatePaymentStatus(id: number, status: "pending" | "approved" | "rejected") {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(paymentRequests).set({ status }).where(eq(paymentRequests.id, id));
}

// ─── Reports ──────────────────────────────────────────────────────────────────
export async function createReport(data: typeof reports.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(reports).values(data);
}

// ─── Announcements ────────────────────────────────────────────────────────────
export async function listAnnouncements() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(announcements).where(eq(announcements.isActive, true)).orderBy(desc(announcements.createdAt)).limit(20);
}

export async function createAnnouncement(data: typeof announcements.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(announcements).values(data);
}

// ─── App Settings ─────────────────────────────────────────────────────────────
export async function getAppSettings() {
  const db = await getDb();
  if (!db) return {} as Record<string, string | null>;
  const rows = await db.select().from(appSettings);
  return Object.fromEntries(rows.map(r => [r.key, r.value]));
}

export async function setAppSetting(key: string, value: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(appSettings).values({ key, value }).onDuplicateKeyUpdate({ set: { value } });
}

// ─── Sequence counter ─────────────────────────────────────────────────────────
export async function nextSeq(): Promise<number> {
  const db = await getDb();
  if (!db) return Math.floor(Math.random() * 9000) + 1000;
  await db.insert(appSettings).values({ key: "seq_counter", value: "1" }).onDuplicateKeyUpdate({
    set: { value: sql`CAST(CAST(value AS UNSIGNED) + 1 AS CHAR)` },
  });
  const [row] = await db.select().from(appSettings).where(eq(appSettings.key, "seq_counter")).limit(1);
  return Number(row?.value || 1);
}
