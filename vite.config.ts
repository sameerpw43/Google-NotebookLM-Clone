// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ESM-safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(async ({ mode }) => {
  const isProd = mode === "production";
  const isReplit = !!process.env.REPL_ID;

  const plugins = [react()];

  // Dev-only error overlay
  if (!isProd) {
    // lazy import so prod builds don’t choke
    const runtimeErrorOverlay = (await import("@replit/vite-plugin-runtime-error-modal")).default ?? (await import("@replit/vite-plugin-runtime-error-modal"));
    plugins.push(runtimeErrorOverlay());
  }

  // Only on Replit + dev
  if (!isProd && isReplit) {
    const { cartographer } = await import("@replit/vite-plugin-cartographer");
    const { devBanner } = await import("@replit/vite-plugin-dev-banner");
    plugins.push(cartographer(), devBanner());
  }

  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "client", "src"),
        "@shared": path.resolve(__dirname, "shared"),
        "@assets": path.resolve(__dirname, "attached_assets"),
      },
    },
    root: path.resolve(__dirname, "client"),
    build: {
      // ✅ keep client output separate from server
      outDir: path.resolve(__dirname, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});
