import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(() => {
  return {
    plugins: [react()],
    server: { port: 5178, host: true },
    build: {
      rollupOptions: {
        output: {
          // Split rarely-changing vendor code into its own long-lived cache
          // chunks so app redeploys don't force re-downloading Three.js etc.
          manualChunks(id) {
            if (!id.includes("node_modules")) return;
            if (id.includes("/three/") || id.includes("/three-")) return "three";
            return "vendor";
          },
        },
      },
    },
  };
});
