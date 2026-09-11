import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  outDir: "dist",
  external: [
    "react",
    "react-dom",
    "better-auth",
    "@cloudflare/kumo",
    "@phosphor-icons/react",
    "react-email",
    "zod",
  ],
});
