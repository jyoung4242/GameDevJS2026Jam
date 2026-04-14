import { defineConfig } from "vite";

// TODO  lit prod mode https://lit.dev/docs/tools/development/#development-and-production-builds
export default defineConfig({
  base: "./",
  build: {
    target: "esnext", //browsers can handle the latest ES features 
  },
  assetsInclude: ["**/*.png", "**/*.jpg", "**/*.svg", "**/*.tff"],
});
