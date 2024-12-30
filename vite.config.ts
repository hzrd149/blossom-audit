import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [dts()],
  build: {
    sourcemap: true,
    lib: {
      entry: "./src/index.ts",
      name: "BlossomServerAudit",
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      // Externalize peer dependencies
      external: ["react", "react-dom"],
      output: {
        // Global variables for UMD build
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    },
  },
});
