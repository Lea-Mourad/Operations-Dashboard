import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: {
    alias: {
      "@/components": path.resolve(
        __dirname,
        "./src/frontend/components",
      ),
      "@/lib": path.resolve(__dirname, "./src/frontend/lib"),
      "@/types": path.resolve(__dirname, "./src/frontend/types"),
      "@": path.resolve(__dirname, "./src/frontend"),
    },
  },
});
