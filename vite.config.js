import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const basePath = "/apps/qr-attendance/";

export default defineConfig({
  base: basePath,
  plugins: [react()],
  server: {
    port: 5299,
    strictPort: true, // Crucial so Vite doesn't switch ports on you

    // Kept for injecting correct script paths into Next.js pages
    origin: process.env.QR_ATTENDANCE_PUBLIC_ORIGIN ?? "http://localhost:3001",

    hmr: {
      protocol: "ws",
      host: "localhost",
      port: 5299, // Bypass Next.js and talk directly to Vite's dev server for hot reloads
    },

    proxy: {
      // Clean up proxy definitions to handle basePath prefix accurately
      [`${basePath}api`]: {
        target: "http://localhost:4001",
        changeOrigin: true,
        rewrite: (path) => path.replace(new RegExp(`^${basePath}api`), "/api"),
      },
      [`${basePath}uploads`]: {
        target: "http://localhost:4001",
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(new RegExp(`^${basePath}uploads`), "/uploads"),
      },
    },
  },
});
