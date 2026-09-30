import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  outputFileTracingRoot: __dirname,
  // no eslint setup in this repo (quality gates = tsc + npm test); Next's
  // built-in build lint fails on react-compiler-prep rules (refs-in-render in
  // the three.js cores, Date.now() in HUD render) that are deliberate here.
  // A real eslint config is distribution-repo work.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
