import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    // Playwright specs live in e2e/ and run via `playwright test`, not vitest.
    exclude: ["e2e/**", "node_modules/**"],
  },
  resolve: {
    alias: {
      // Mirror the tsconfig "@/*" path alias for tests.
      "@": fileURLToPath(new URL("./", import.meta.url)),
      // `server-only` throws when imported outside a React Server Component;
      // in unit tests it should be an inert no-op.
      "server-only": fileURLToPath(new URL("./test/server-only-stub.ts", import.meta.url)),
    },
  },
});
