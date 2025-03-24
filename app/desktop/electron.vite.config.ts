import { defineConfig } from "electron-vite";
import path from "path";

export default defineConfig({
  main: {
    optimizeDeps: {
      include: ["@management/lang-tidal"], // Ensures Vite processes this dependency
    },
    resolve: {
      alias: {
        "@core": path.resolve(__dirname, "../../core"),
        "@management/lang-tidal": path.resolve(
          __dirname,
          "../../packages/languages/tidal/ghci.ts"
        ),
      },
    },
  },
  preload: {
    // vite config options
  },
  renderer: {
    resolve: {
      alias: {
        "@core": path.resolve(__dirname, "../../core"),
        "@management/cm-evaluate": path.resolve(
          __dirname,
          "../../packages/codemirror/evaluate/src/index.ts"
        ),
      },
    },
  },
});
