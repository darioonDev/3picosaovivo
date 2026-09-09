import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      // The real package throws on import outside a Server Component, which is
      // exactly its job in the app and exactly what stops a server-only module
      // being unit tested. Next enforces that boundary at build time; here we
      // stub it so the registry's own rules can be asserted.
      "server-only": path.resolve(__dirname, "vitest.server-only-stub.ts"),
    },
  },
  test: {
    environment: "jsdom",
    // next build copies the sources into .next/standalone, so without this
    // every test file is collected and run a second time from there.
    exclude: ["node_modules/**", ".next/**"],
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
  },
});
