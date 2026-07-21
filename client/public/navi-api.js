/**
 * navi-api.js — API bridge between Navi UI and tRPC backend
 * Replaces localStorage with real database calls via tRPC
 * Supports polling for realtime-like updates
 */
(function (window) {
  "use strict";

  // ─── tRPC helper ────────────────────────────────────────────────────────────
  async function trpc(path, input, method) {
    method = method || "query";
    try {
      if (method === "query") {
        const params = encodeURIComponent(JSON.stringify({ "0": { json: input } }));
        const res = await fetch("/api/trpc/" + path + "?batch=1&input=" + params, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.json();
        return data[0]?.result?.data?.json ?? data[0]?.result?.data;
      } else {
        const res = await fetch("/api/trpc/" + path + "?batch=1", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ "0": { json: input } }),
        });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.json();
        return data[0]?.result?.data?.json ?? data[0]?.result?.data;
      }
    } catch (e) {
      console.warn("[navi-api] Error calling " + path + ":", e.message);
      return null;
    }
  }

  // ─── Device ID ──────────────────────────────────────────────────────────────
  function getDeviceId() {
    let did = localStorage.getItem("navi_did");
    if (!did) {
      did = "d_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("navi_did", did);
    }
    return did;
  }

  // ─── Ads API ────────────────────────────────────────────────────────────────
  async function getAds(category, search) {
    const data = await trpc("ads.list", { category: category, search: search });
    if (!data) return JSON.parse(localStorage.getItem("navi_ads") || "[]");
    // Normalize to match existing UI format
    return data.map(function (a) {
      return {
        id: String(a.id),
        did: a.deviceId,
        cat: a.category,
        title: a.title,
        desc: a.description || "",
        price: a.price || "",
        phone: a.phone || "",
        photo: a.photoUrl || "",
        ts: new Date(a.createdAt).getTime(),
        active: a.isActive,
      };
    });
  }

  async function createAd(adData) {
    const did = getDeviceId();
    const id = await trpc("ads.create", {
      deviceId: did,
      category: adData.cat || "sell",
      title: adData.title,
      description: adData.desc || "",
      price: adData.price || "",
      phone: adData.phone || "",
      photoUrl: adData.photo || "",
    }, "mutation");
    // Also update localStorage as cache
    const ads = JSON.parse(localStorage.getItem("navi_ads") || "[]");
    adData.id = id ? String(id) : adData.id;
    adData.did = did;
    ads.unshift(adData);
    localStorage.setItem("navi_ads", JSON.stringify(ads));
    return adData;
  }

  async function deleteAd(id) {
    const did = getDeviceId();
    await trpc("ads.delete", { id: parseInt(id), deviceId: did }, "mutation");
    // Update localStorage cache
    const ads = JSON.parse(localStorage.getItem("navi_ads") || "[]");
    const updated = ads.filter(function (a) { return a.id !== id; });
    localStorage.setItem("navi_ads", JSON.stringify(updated));
  }

  // ─── Businesses API ─────────────────────────────────────────────────────────
  async function getBusinesses(category, search) {
    const data = await trpc("businesses.list", { category: category, search: search });
    if (!data) return JSON.parse(localStorage.getItem("navi_bizs") || "[]");
    return data.map(function (b) {
      return {
        id: String(b.id),
        did: b.deviceId,
        name: b.name,
        cat: b.category || "",
        desc: b.description || "",
        phone: b.phone || "",
        addr: b.address || "",
        cover: b.coverUrl || "",
        logo: b.logoUrl || "",
        tags: b.tags ? JSON.parse(b.tags) : [],
        hours: b.workHours ? JSON.parse(b.workHours) : {},
        rating: parseFloat(b.rating || "0"),
        reviews: b.reviewCount || 0,
        active: b.isActive,
        ts: new Date(b.createdAt).getTime(),
      };
    });
  }

  async function getMyBusiness() {
    const did = getDeviceId();
    // First check localStorage cache
    const cached = localStorage.getItem("navi_biz_user");
    const data = await trpc("businesses.getByDevice", { deviceId: did });
    if (!data) return cached ? JSON.parse(cached) : null;
    const biz = {
      id: String(data.id),
      did: data.deviceId,
      name: data.name,
      cat: data.category || "",
      desc: data.description || "",
      phone: data.phone || "",
      addr: data.address || "",
      cover: data.coverUrl || "",
      logo: data.logoUrl || "",
      tags: data.tags ? JSON.parse(data.tags) : [],
      hours: data.workHours ? JSON.parse(data.workHours) : {},
      rating: parseFloat(data.rating || "0"),
      reviews: data.reviewCount || 0,
      active: data.isActive,
    };
    localStorage.setItem("navi_biz_user", JSON.stringify(biz));
    return biz;
  }

  async function createBusiness(bizData) {
    const did = getDeviceId();
    const id = await trpc("businesses.create", {
      deviceId: did,
      name: bizData.name,
      category: bizData.cat || "",
      description: bizData.desc || "",
      phone: bizData.phone || "",
      address: bizData.addr || "",
      coverUrl: bizData.cover || "",
      logoUrl: bizData.logo || "",
      tags: bizData.tags ? JSON.stringify(bizData.tags) : "",
      workHours: bizData.hours ? JSON.stringify(bizData.hours) : "",
    }, "mutation");
    bizData.id = id ? String(id) : bizData.id;
    bizData.did = did;
    localStorage.setItem("navi_biz_user", JSON.stringify(bizData));
    return bizData;
  }

  async function updateBusiness(bizData) {
    const did = getDeviceId();
    await trpc("businesses.update", {
      id: parseInt(bizData.id),
      deviceId: did,
      name: bizData.name,
      category: bizData.cat || "",
      description: bizData.desc || "",
      phone: bizData.phone || "",
      address: bizData.addr || "",
      coverUrl: bizData.cover || "",
      logoUrl: bizData.logo || "",
      tags: bizData.tags ? JSON.stringify(bizData.tags) : "",
      workHours: bizData.hours ? JSON.stringify(bizData.hours) : "",
    }, "mutation");
    localStorage.setItem("navi_biz_user", JSON.stringify(bizData));
    return bizData;
  }

  // ─── Products API ───────────────────────────────────────────────────────────
  async function getProducts(businessId) {
    const data = await trpc("businesses.listProducts", { businessId: parseInt(businessId) });
    if (!data) return JSON.parse(localStorage.getItem("navi_prods") || "[]");
    return data.map(function (p) {
      return {
        id: String(p.id),
        bid: String(p.businessId),
        name: p.name,
        price: p.price || "",
        unit: p.unit || "",
        photo: p.photoUrl || "",
      };
    });
  }

  async function createProduct(prodData) {
    const id = await trpc("businesses.createProduct", {
      businessId: parseInt(prodData.bid),
      name: prodData.name,
      price: prodData.price || "",
      unit: prodData.unit || "",
      photoUrl: prodData.photo || "",
    }, "mutation");
    prodData.id = id ? String(id) : prodData.id;
    return prodData;
  }

  async function deleteProduct(id, businessId) {
    await trpc("businesses.deleteProduct", { id: parseInt(id), businessId: parseInt(businessId) }, "mutation");
  }

  // ─── Orders API ─────────────────────────────────────────────────────────────
  async function getOrders(businessId) {
    const did = getDeviceId();
    if (businessId) {
      const data = await trpc("orders.listForBusiness", { businessId: parseInt(businessId), deviceId: did });
      if (!data) return JSON.parse(localStorage.getItem("navi_orders") || "[]");
      return data.map(normalizeOrder);
    } else {
      const data = await trpc("orders.listByDevice", { deviceId: did });
      if (!data) return JSON.parse(localStorage.getItem("navi_orders") || "[]");
      return data.map(normalizeOrder);
    }
  }

  function normalizeOrder(o) {
    return {
      id: String(o.id),
      seq: o.seqNumber,
      did: o.deviceId,
      bid: String(o.businessId),
      bizName: o.businessName || "",
      cName: o.customerName || "",
      cPhone: o.customerPhone || "",
      items: o.items ? JSON.parse(o.items) : [],
      total: o.total || "",
      status: o.status,
      pay: o.paymentMethod || "cash",
      ts: new Date(o.createdAt).getTime(),
    };
  }

  async function createOrder(orderData) {
    const did = getDeviceId();
    const id = await trpc("orders.create", {
      deviceId: did,
      businessId: parseInt(orderData.bid),
      businessName: orderData.bizName || "",
      customerName: orderData.cName || "",
      customerPhone: orderData.cPhone || "",
      items: JSON.stringify(orderData.items || []),
      total: orderData.total || "",
      paymentMethod: orderData.pay || "cash",
    }, "mutation");
    orderData.id = id ? String(id) : orderData.id;
    orderData.did = did;
    return orderData;
  }

  async function updateOrderStatus(id, businessId, status) {
    const did = getDeviceId();
    await trpc("orders.updateStatus", {
      id: parseInt(id),
      businessId: parseInt(businessId),
      deviceId: did,
      status: status,
    }, "mutation");
  }

  // ─── Bookings API ───────────────────────────────────────────────────────────
  async function getBookings(businessId) {
    const did = getDeviceId();
    if (businessId) {
      const data = await trpc("bookings.listForBusiness", { businessId: parseInt(businessId), deviceId: did });
      if (!data) return JSON.parse(localStorage.getItem("navi_bookings") || "[]");
      return data.map(normalizeBooking);
    } else {
      const data = await trpc("bookings.listByDevice", { deviceId: did });
      if (!data) return JSON.parse(localStorage.getItem("navi_bookings") || "[]");
      return data.map(normalizeBooking);
    }
  }

  function normalizeBooking(b) {
    return {
      id: String(b.id),
      seq: b.seqNumber,
      did: b.deviceId,
      bid: String(b.businessId),
      bizName: b.businessName || "",
      service: b.serviceName || "",
      cName: b.customerName || "",
      cPhone: b.customerPhone || "",
      date: b.date || "",
      time: b.time || "",
      status: b.status,
      ts: new Date(b.createdAt).getTime(),
    };
  }

  async function createBooking(bookingData) {
    const did = getDeviceId();
    const id = await trpc("bookings.create", {
      deviceId: did,
      businessId: parseInt(bookingData.bid),
      businessName: bookingData.bizName || "",
      serviceName: bookingData.service || "",
      customerName: bookingData.cName || "",
      customerPhone: bookingData.cPhone || "",
      date: bookingData.date || "",
      time: bookingData.time || "",
    }, "mutation");
    bookingData.id = id ? String(id) : bookingData.id;
    bookingData.did = did;
    return bookingData;
  }

  async function updateBookingStatus(id, businessId, status) {
    const did = getDeviceId();
    await trpc("bookings.updateStatus", {
      id: parseInt(id),
      businessId: parseInt(businessId),
      deviceId: did,
      status: status,
    }, "mutation");
  }

  // ─── Reviews API ────────────────────────────────────────────────────────────
  async function getReviews(businessId) {
    const data = await trpc("businesses.listReviews", { businessId: parseInt(businessId) });
    if (!data) return JSON.parse(localStorage.getItem("navi_reviews") || "[]");
    return data.map(function (r) {
      return {
        id: String(r.id),
        bid: String(r.businessId),
        did: r.deviceId,
        author: r.authorName || "Аноним",
        rating: r.rating,
        text: r.text || "",
        ts: new Date(r.createdAt).getTime(),
      };
    });
  }

  async function createReview(reviewData) {
    const did = getDeviceId();
    await trpc("businesses.createReview", {
      businessId: parseInt(reviewData.bid),
      deviceId: did,
      authorName: reviewData.author || "",
      rating: reviewData.rating,
      text: reviewData.text || "",
    }, "mutation");
    return reviewData;
  }

  // ─── Feed API ───────────────────────────────────────────────────────────────
  async function getFeed() {
    const data = await trpc("feed.list", {});
    if (!data) return [];
    return data.map(function (p) {
      return {
        id: String(p.id),
        device_id: p.deviceId,
        user_name: p.authorName || (p.deviceId ? "Пользователь" : "Аноним"),
        photo: p.mediaType === "image" ? (p.mediaUrl || "") : "",
        video: p.mediaType === "video" ? (p.mediaUrl || "") : "",
        type: p.mediaType || "image",
        caption: p.caption || "",
        reactions: p.reactions || { "👍": 0, "❤️": 0, "👏": 0, "😮": 0 },
        created_at: new Date(p.createdAt).toISOString(),
        expires_at: null,
      };
    });
  }

  async function createFeedPost(postData) {
    const did = getDeviceId();
    const id = await trpc("feed.create", {
      deviceId: did,
      authorName: postData.user_name || "",
      mediaUrl: postData.photo || postData.video || "",
      mediaType: postData.type || "image",
      caption: postData.caption || "",
    }, "mutation");
    postData.id = id ? String(id) : postData.id;
    postData.device_id = did;
    return postData;
  }

  async function deleteFeedPost(id) {
    const did = getDeviceId();
    return trpc("feed.delete", { id: parseInt(id), deviceId: did }, "mutation");
  }

  async function uploadFeedMedia(file) {
    const formData = new FormData();
    formData.append("file", file);
    const resp = await fetch("/api/feed/upload", { method: "POST", body: formData });
    if (!resp.ok) throw new Error("Upload failed: " + resp.status);
    const data = await resp.json();
    return data.url;
  }

  async function uploadFeedMediaBase64(dataUrl, type) {
    // Convert base64 data URL to blob and upload
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const ext = type === "video" ? "mp4" : "jpg";
    const file = new File([blob], "feed." + ext, { type: blob.type || (type === "video" ? "video/mp4" : "image/jpeg") });
    return uploadFeedMedia(file);
  }

  async function toggleReaction(postId, emoji) {
    const did = getDeviceId();
    return trpc("feed.toggleReaction", { postId: parseInt(postId), deviceId: did, emoji: emoji }, "mutation");
  }

  // ─── Announcements API ──────────────────────────────────────────────────────
  async function getAnnouncements() {
    const data = await trpc("announcements.list", {});
    if (!data) return JSON.parse(localStorage.getItem("navi_announcements") || "[]");
    return data.map(function (a) {
      return {
        id: String(a.id),
        title: a.title,
        body: a.body || "",
        ts: new Date(a.createdAt).getTime(),
      };
    });
  }

  // ─── Payment Requests API ───────────────────────────────────────────────────
  async function getPaymentRequests() {
    const did = getDeviceId();
    const data = await trpc("payments.list", { deviceId: did });
    if (!data) return JSON.parse(localStorage.getItem("navi_payment_requests") || "[]");
    return data.map(function (p) {
      return {
        id: String(p.id),
        seq: p.seqNumber,
        did: p.deviceId,
        plan: p.planKey,
        planName: p.planName || "",
        bizName: p.businessName || "",
        owner: p.ownerName || "",
        phone: p.phone || "",
        card: p.paymentCard || "",
        receipt: p.receiptUrl || "",
        status: p.status,
        ts: new Date(p.createdAt).getTime(),
      };
    });
  }

  async function createPaymentRequest(prData) {
    const did = getDeviceId();
    const id = await trpc("payments.create", {
      deviceId: did,
      planKey: prData.plan || "",
      planName: prData.planName || "",
      businessName: prData.bizName || "",
      ownerName: prData.owner || "",
      phone: prData.phone || "",
      paymentCard: prData.card || "",
      receiptUrl: prData.receipt || "",
    }, "mutation");
    prData.id = id ? String(id) : prData.id;
    prData.did = did;
    return prData;
  }

  // ─── Subscription API ───────────────────────────────────────────────────────
  async function updateAdSubscription(id, expiresAt) {
    return trpc("ads.updateSubscription", { id: parseInt(id), expiresAt: new Date(expiresAt) }, "mutation");
  }

  async function updateBizSubscription(id, expiresAt) {
    return trpc("businesses.updateSubscription", { id: parseInt(id), expiresAt: new Date(expiresAt) }, "mutation");
  }

  // ─── Reports API ────────────────────────────────────────────────────────────
  async function createReport(reportData) {
    const did = getDeviceId();
    await trpc("reports.create", {
      deviceId: did,
      targetType: reportData.type || "ad",
      targetId: parseInt(reportData.targetId),
      reason: reportData.reason || "",
    }, "mutation");
  }

  // ─── App Settings API ───────────────────────────────────────────────────────
  async function getSettings() {
    const data = await trpc("settings.get", {});
    return data || {};
  }

  async function setSetting(key, value) {
    await trpc("settings.set", { key: key, value: value }, "mutation");
  }

  // ─── Polling (realtime updates) ─────────────────────────────────────────────
  var _pollCallbacks = {};
  var _pollIntervals = {};

  function startPolling(key, fn, intervalMs) {
    stopPolling(key);
    _pollCallbacks[key] = fn;
    fn(); // immediate first call
    _pollIntervals[key] = setInterval(fn, intervalMs || 10000);
  }

  function stopPolling(key) {
    if (_pollIntervals[key]) {
      clearInterval(_pollIntervals[key]);
      delete _pollIntervals[key];
    }
  }

  // ─── Public API ─────────────────────────────────────────────────────────────
  window.NaviAPI = {
    // Device
    getDeviceId: getDeviceId,

    // Ads
    getAds: getAds,
    createAd: createAd,
    deleteAd: deleteAd,

    // Businesses
    getBusinesses: getBusinesses,
    getMyBusiness: getMyBusiness,
    createBusiness: createBusiness,
    updateBusiness: updateBusiness,

    // Products
    getProducts: getProducts,
    createProduct: createProduct,
    deleteProduct: deleteProduct,

    // Orders
    getOrders: getOrders,
    createOrder: createOrder,
    updateOrderStatus: updateOrderStatus,

    // Bookings
    getBookings: getBookings,
    createBooking: createBooking,
    updateBookingStatus: updateBookingStatus,

    // Reviews
    getReviews: getReviews,
    createReview: createReview,

    // Feed
    getFeed: getFeed,
    createFeedPost: createFeedPost,
    deleteFeedPost: deleteFeedPost,
    uploadFeedMedia: uploadFeedMedia,
    uploadFeedMediaBase64: uploadFeedMediaBase64,
    toggleReaction: toggleReaction,

    // Announcements
    getAnnouncements: getAnnouncements,

    // Payments
    getPaymentRequests: getPaymentRequests,
    createPaymentRequest: createPaymentRequest,

    // Subscriptions
    updateAdSubscription: updateAdSubscription,
    updateBizSubscription: updateBizSubscription,

    // Reports
    createReport: createReport,

    // Settings
    getSettings: getSettings,
    setSetting: setSetting,

    // Polling
    startPolling: startPolling,
    stopPolling: stopPolling,
  };

  console.log("[NaviAPI] Loaded — connected to shared database");
})(window);
