import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// ⬇️ Wichtig für Molstar
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Diese Zeile sorgt dafür, dass Mol* die lokale React-Version verwendet
      react: path.resolve("./node_modules/react"),
      "react-dom": path.resolve("./node_modules/react-dom"),
    },
  },
  server: {
    port: 5173,
  },
});
