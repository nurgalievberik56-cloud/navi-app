import {
  boolean,
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  phone: varchar("phone", { length: 32 }),
  lang: varchar("lang", { length: 8 }).default("ru"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Ads (Объявления) ─────────────────────────────────────────────────────────
export const ads = mysqlTable("ads", {
  id: int("id").autoincrement().primaryKey(),
  deviceId: varchar("deviceId", { length: 64 }).notNull(),
  userId: int("userId"),
  category: mysqlEnum("category", ["sell", "buy", "service", "free"]).notNull().default("sell"),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  price: varchar("price", { length: 64 }),
  phone: varchar("phone", { length: 32 }),
  photoUrl: text("photoUrl"),
  expiresAt: timestamp("expiresAt"),
  isActive: boolean("isActive").default(true).notNull(),
  subscriptionExpiresAt: timestamp("subscriptionExpiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Ad = typeof ads.$inferSelect;
export type InsertAd = typeof ads.$inferInsert;

// ─── Business (Бизнес-страницы) ───────────────────────────────────────────────
export const businesses = mysqlTable("businesses", {
  id: int("id").autoincrement().primaryKey(),
  deviceId: varchar("deviceId", { length: 64 }).notNull(),
  userId: int("userId"),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 64 }),
  description: text("description"),
  phone: varchar("phone", { length: 32 }),
  address: text("address"),
  coverUrl: text("coverUrl"),
  logoUrl: text("logoUrl"),
  tags: text("tags"),
  workHours: text("workHours"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  reviewCount: int("reviewCount").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  subscriptionExpiresAt: timestamp("subscriptionExpiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Business = typeof businesses.$inferSelect;
export type InsertBusiness = typeof businesses.$inferInsert;

// ─── Products (Товары/услуги бизнеса) ─────────────────────────────────────────
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  price: varchar("price", { length: 64 }),
  unit: varchar("unit", { length: 32 }),
  photoUrl: text("photoUrl"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// ─── Orders (Заказы) ──────────────────────────────────────────────────────────
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  seqNumber: int("seqNumber").notNull(),
  deviceId: varchar("deviceId", { length: 64 }).notNull(),
  businessId: int("businessId").notNull(),
  businessName: varchar("businessName", { length: 255 }),
  customerName: varchar("customerName", { length: 255 }),
  customerPhone: varchar("customerPhone", { length: 32 }),
  items: text("items").notNull(),
  total: varchar("total", { length: 64 }),
  status: mysqlEnum("status", ["new", "confirmed", "ready", "done", "cancelled"]).default("new").notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["cash", "card"]).default("cash"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// ─── Bookings (Записи на услуги) ──────────────────────────────────────────────
export const bookings = mysqlTable("bookings", {
  id: int("id").autoincrement().primaryKey(),
  seqNumber: int("seqNumber").notNull(),
  deviceId: varchar("deviceId", { length: 64 }).notNull(),
  businessId: int("businessId").notNull(),
  businessName: varchar("businessName", { length: 255 }),
  serviceName: varchar("serviceName", { length: 255 }),
  customerName: varchar("customerName", { length: 255 }),
  customerPhone: varchar("customerPhone", { length: 32 }),
  date: varchar("date", { length: 32 }),
  time: varchar("time", { length: 16 }),
  status: mysqlEnum("status", ["new", "confirmed", "done", "cancelled"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

// ─── Reviews (Отзывы) ─────────────────────────────────────────────────────────
export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  deviceId: varchar("deviceId", { length: 64 }).notNull(),
  authorName: varchar("authorName", { length: 255 }),
  rating: int("rating").notNull(),
  text: text("text"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

// ─── Feed Posts (Лента) ───────────────────────────────────────────────────────
export const feedPosts = mysqlTable("feed_posts", {
  id: int("id").autoincrement().primaryKey(),
  deviceId: varchar("deviceId", { length: 64 }).notNull(),
  userId: int("userId"),
  authorName: varchar("authorName", { length: 255 }),
  businessId: int("businessId"),
  mediaUrl: text("mediaUrl"),
  mediaType: mysqlEnum("mediaType", ["image", "video"]),
  caption: text("caption"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type FeedPost = typeof feedPosts.$inferSelect;
export type InsertFeedPost = typeof feedPosts.$inferInsert;

// ─── Feed Reactions (Реакции на посты) ───────────────────────────────────────
export const feedReactions = mysqlTable("feed_reactions", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  deviceId: varchar("deviceId", { length: 64 }).notNull(),
  emoji: varchar("emoji", { length: 8 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type FeedReaction = typeof feedReactions.$inferSelect;
export type InsertFeedReaction = typeof feedReactions.$inferInsert;

// ─── Payment Requests (Запросы на подписку) ───────────────────────────────────
export const paymentRequests = mysqlTable("payment_requests", {
  id: int("id").autoincrement().primaryKey(),
  seqNumber: int("seqNumber").notNull(),
  deviceId: varchar("deviceId", { length: 64 }).notNull(),
  planKey: varchar("planKey", { length: 64 }).notNull(),
  planName: varchar("planName", { length: 255 }),
  businessName: varchar("businessName", { length: 255 }),
  ownerName: varchar("ownerName", { length: 255 }),
  phone: varchar("phone", { length: 32 }),
  paymentCard: varchar("paymentCard", { length: 64 }),
  receiptUrl: text("receiptUrl"),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PaymentRequest = typeof paymentRequests.$inferSelect;
export type InsertPaymentRequest = typeof paymentRequests.$inferInsert;

// ─── Reports (Жалобы) ─────────────────────────────────────────────────────────
export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  deviceId: varchar("deviceId", { length: 64 }).notNull(),
  targetType: mysqlEnum("targetType", ["ad", "business", "post"]).notNull(),
  targetId: int("targetId").notNull(),
  reason: text("reason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

// ─── Announcements (Объявления от администратора) ─────────────────────────────
export const announcements = mysqlTable("announcements", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = typeof announcements.$inferInsert;

// ─── App Settings (Настройки приложения — цены, платёжные реквизиты) ─────────
export const appSettings = mysqlTable("app_settings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 64 }).notNull().unique(),
  value: text("value"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type AppSetting = typeof appSettings.$inferSelect;

// ─── Ad Views (Просмотры объявлений) ─────────────────────────────────────────
export const adViews = mysqlTable("ad_views", {
  id: int("id").autoincrement().primaryKey(),
  adId: int("adId").notNull(),
  deviceId: varchar("deviceId", { length: 64 }).notNull(),
  viewedAt: timestamp("viewedAt").defaultNow().notNull(),
});
export type AdView = typeof adViews.$inferSelect;
export type InsertAdView = typeof adViews.$inferInsert;

// ─── Completed Orders (Выполненные заказы) ───────────────────────────────────
export const completedOrders = mysqlTable("completed_orders", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  businessId: int("businessId").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
});
export type CompletedOrder = typeof completedOrders.$inferSelect;
export type InsertCompletedOrder = typeof completedOrders.$inferInsert;

// ─── Business Analytics (Аналитика бизнеса) ──────────────────────────────────
export const businessAnalytics = mysqlTable("business_analytics", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  viewsCount: int("viewsCount").default(0).notNull(),
  ordersCount: int("ordersCount").default(0).notNull(),
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).default("0.00").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type BusinessAnalytic = typeof businessAnalytics.$inferSelect;
export type InsertBusinessAnalytic = typeof businessAnalytics.$inferInsert;

// ─── Navi Store (синхронизация localStorage с БД) ─────────────────────────────
export const naviStore = mysqlTable("navi_store", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 64 }).notNull().unique(),
  value: text("value"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type NaviStore = typeof naviStore.$inferSelect;
