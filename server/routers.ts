import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,

  // ─── Auth ──────────────────────────────────────────────────────────────────
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Ads ───────────────────────────────────────────────────────────────────
  ads: router({
    list: publicProcedure
      .input(z.object({ category: z.string().optional(), search: z.string().optional() }))
      .query(({ input }) => db.listAds(input.category, input.search)),

    create: publicProcedure
      .input(z.object({
        deviceId: z.string(),
        category: z.enum(["sell", "buy", "service", "free"]).default("sell"),
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        price: z.string().optional(),
        phone: z.string().optional(),
        photoUrl: z.string().optional(),
      }))
      .mutation(({ input }) => db.createAd(input)),

    delete: publicProcedure
      .input(z.object({ id: z.number(), deviceId: z.string() }))
      .mutation(({ input }) => db.deleteAd(input.id, input.deviceId)),

    updateSubscription: publicProcedure
      .input(z.object({ id: z.number(), expiresAt: z.date() }))
      .mutation(({ input }) => db.updateAdSubscription(input.id, input.expiresAt)),
  }),

  // ─── Businesses ────────────────────────────────────────────────────────────
  businesses: router({
    list: publicProcedure
      .input(z.object({ category: z.string().optional(), search: z.string().optional() }))
      .query(({ input }) => db.listBusinesses(input.category, input.search)),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => db.getBusinessById(input.id)),

    getByDevice: publicProcedure
      .input(z.object({ deviceId: z.string() }))
      .query(({ input }) => db.getBusinessByDeviceId(input.deviceId)),

    create: publicProcedure
      .input(z.object({
        deviceId: z.string(),
        name: z.string().min(1).max(255),
        category: z.string().optional(),
        description: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        coverUrl: z.string().optional(),
        logoUrl: z.string().optional(),
        tags: z.string().optional(),
        workHours: z.string().optional(),
      }))
      .mutation(({ input }) => db.createBusiness(input)),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        deviceId: z.string(),
        name: z.string().optional(),
        category: z.string().optional(),
        description: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        coverUrl: z.string().optional(),
        logoUrl: z.string().optional(),
        tags: z.string().optional(),
        workHours: z.string().optional(),
      }))
      .mutation(({ input }) => {
        const { id, deviceId, ...data } = input;
        return db.updateBusiness(id, deviceId, data);
      }),

    updateSubscription: publicProcedure
      .input(z.object({ id: z.number(), expiresAt: z.date() }))
      .mutation(({ input }) => db.updateBusinessSubscription(input.id, input.expiresAt)),

    listProducts: publicProcedure
      .input(z.object({ businessId: z.number() }))
      .query(({ input }) => db.listProducts(input.businessId)),

    createProduct: publicProcedure
      .input(z.object({
        businessId: z.number(),
        name: z.string().min(1),
        price: z.string().optional(),
        unit: z.string().optional(),
        photoUrl: z.string().optional(),
      }))
      .mutation(({ input }) => db.createProduct(input)),

    deleteProduct: publicProcedure
      .input(z.object({ id: z.number(), businessId: z.number() }))
      .mutation(({ input }) => db.deleteProduct(input.id, input.businessId)),

    listReviews: publicProcedure
      .input(z.object({ businessId: z.number() }))
      .query(({ input }) => db.listReviews(input.businessId)),

    createReview: publicProcedure
      .input(z.object({
        businessId: z.number(),
        deviceId: z.string(),
        authorName: z.string().optional(),
        rating: z.number().min(1).max(5),
        text: z.string().optional(),
      }))
      .mutation(({ input }) => db.createReview(input)),
  }),

  // ─── Orders ────────────────────────────────────────────────────────────────
  orders: router({
    listForBusiness: publicProcedure
      .input(z.object({ businessId: z.number(), deviceId: z.string() }))
      .query(async ({ input }) => {
        const biz = await db.getBusinessByDeviceId(input.deviceId);
        if (!biz || biz.id !== input.businessId) throw new TRPCError({ code: "FORBIDDEN" });
        return db.listOrdersForBusiness(input.businessId);
      }),

    listByDevice: publicProcedure
      .input(z.object({ deviceId: z.string() }))
      .query(({ input }) => db.listOrdersByDevice(input.deviceId)),

    create: publicProcedure
      .input(z.object({
        deviceId: z.string(),
        businessId: z.number(),
        businessName: z.string().optional(),
        customerName: z.string().optional(),
        customerPhone: z.string().optional(),
        items: z.string(),
        total: z.string().optional(),
        paymentMethod: z.enum(["cash", "card"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const seq = await db.nextSeq();
        return db.createOrder({ ...input, seqNumber: seq });
      }),

    updateStatus: publicProcedure
      .input(z.object({
        id: z.number(),
        businessId: z.number(),
        deviceId: z.string(),
        status: z.enum(["new", "confirmed", "ready", "done", "cancelled"]),
      }))
      .mutation(async ({ input }) => {
        const biz = await db.getBusinessByDeviceId(input.deviceId);
        if (!biz || biz.id !== input.businessId) throw new TRPCError({ code: "FORBIDDEN" });
        return db.updateOrderStatus(input.id, input.businessId, input.status);
      }),
  }),

  // ─── Bookings ──────────────────────────────────────────────────────────────
  bookings: router({
    listForBusiness: publicProcedure
      .input(z.object({ businessId: z.number(), deviceId: z.string() }))
      .query(async ({ input }) => {
        const biz = await db.getBusinessByDeviceId(input.deviceId);
        if (!biz || biz.id !== input.businessId) throw new TRPCError({ code: "FORBIDDEN" });
        return db.listBookingsForBusiness(input.businessId);
      }),

    listByDevice: publicProcedure
      .input(z.object({ deviceId: z.string() }))
      .query(({ input }) => db.listBookingsByDevice(input.deviceId)),

    create: publicProcedure
      .input(z.object({
        deviceId: z.string(),
        businessId: z.number(),
        businessName: z.string().optional(),
        serviceName: z.string().optional(),
        customerName: z.string().optional(),
        customerPhone: z.string().optional(),
        date: z.string().optional(),
        time: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const seq = await db.nextSeq();
        return db.createBooking({ ...input, seqNumber: seq });
      }),

    updateStatus: publicProcedure
      .input(z.object({
        id: z.number(),
        businessId: z.number(),
        deviceId: z.string(),
        status: z.enum(["new", "confirmed", "done", "cancelled"]),
      }))
      .mutation(async ({ input }) => {
        const biz = await db.getBusinessByDeviceId(input.deviceId);
        if (!biz || biz.id !== input.businessId) throw new TRPCError({ code: "FORBIDDEN" });
        return db.updateBookingStatus(input.id, input.businessId, input.status);
      }),
  }),

  // ─── Feed ──────────────────────────────────────────────────────────────────
  feed: router({
    list: publicProcedure.query(() => db.listFeedPostsWithReactions()),

    create: publicProcedure
      .input(z.object({
        deviceId: z.string(),
        authorName: z.string().optional(),
        businessId: z.number().optional(),
        mediaUrl: z.string().optional(),
        mediaType: z.enum(["image", "video"]).optional(),
        caption: z.string().optional(),
      }))
      .mutation(({ input }) => db.createFeedPost(input)),

    toggleReaction: publicProcedure
      .input(z.object({ postId: z.number(), deviceId: z.string(), emoji: z.string() }))
      .mutation(({ input }) => db.toggleReaction(input.postId, input.deviceId, input.emoji)),

    listReactions: publicProcedure
      .input(z.object({ postId: z.number() }))
      .query(({ input }) => db.listReactionsForPost(input.postId)),

    delete: publicProcedure
      .input(z.object({ id: z.number(), deviceId: z.string() }))
      .mutation(({ input }) => db.deleteFeedPost(input.id, input.deviceId)),
  }),

  // ─── Payment Requests ──────────────────────────────────────────────────────
  payments: router({
    list: publicProcedure
      .input(z.object({ deviceId: z.string() }))
      .query(() => db.listPaymentRequests()),

    create: publicProcedure
      .input(z.object({
        deviceId: z.string(),
        planKey: z.string(),
        planName: z.string().optional(),
        businessName: z.string().optional(),
        ownerName: z.string().optional(),
        phone: z.string().optional(),
        paymentCard: z.string().optional(),
        receiptUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const seq = await db.nextSeq();
        return db.createPaymentRequest({ ...input, seqNumber: seq });
      }),

    updateStatus: publicProcedure
      .input(z.object({ id: z.number(), status: z.enum(["pending", "approved", "rejected"]) }))
      .mutation(({ input }) => db.updatePaymentStatus(input.id, input.status)),
  }),

  // ─── Reports ───────────────────────────────────────────────────────────────
  reports: router({
    create: publicProcedure
      .input(z.object({
        deviceId: z.string(),
        targetType: z.enum(["ad", "business", "post"]),
        targetId: z.number(),
        reason: z.string().optional(),
      }))
      .mutation(({ input }) => db.createReport(input)),
  }),

  // ─── Announcements ─────────────────────────────────────────────────────────
  announcements: router({
    list: publicProcedure.query(() => db.listAnnouncements()),

    create: publicProcedure
      .input(z.object({ title: z.string().min(1), body: z.string().optional() }))
      .mutation(({ input }) => db.createAnnouncement(input)),
  }),

  // ─── App Settings ──────────────────────────────────────────────────────────
  settings: router({
    get: publicProcedure.query(() => db.getAppSettings()),
    set: publicProcedure
      .input(z.object({ key: z.string(), value: z.string() }))
      .mutation(({ input }) => db.setAppSetting(input.key, input.value)),
  }),
});

export type AppRouter = typeof appRouter;
