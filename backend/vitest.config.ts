import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
  },
  resolve: {
    alias: {
      "../../node_modules/satori/yoga.wasm": path.resolve(
        __dirname,
        "tests/__mocks__/empty-wasm.ts"
      ),
      "../../node_modules/@resvg/resvg-wasm/index_bg.wasm": path.resolve(
        __dirname,
        "tests/__mocks__/empty-wasm.ts"
      ),
    },
  },
});
