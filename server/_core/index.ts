import "dotenv/config";
import express from "express";
import { createServer } from "http";

import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { registerNaviStoreRoutes } from "../naviStore";
import { registerFeedUploadRoute } from "../feedUpload";

// In production (Autoscale/Cloud Run), PORT is set by the platform and must be used directly
// Do NOT search for available ports — it causes timeouts and 500 errors

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerNaviStoreRoutes(app);
  registerFeedUploadRoute(app);
  // Redirect root to the main Navi app (instant, no JS required)
  app.get("/", (_req, res) => {
    res.redirect(302, "/index-navi.html");
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // In production (Autoscale/Cloud Run), use PORT directly without searching
  const port = parseInt(process.env.PORT || "3000");
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
