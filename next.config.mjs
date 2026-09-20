import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: projectRoot,
  },
  outputFileTracingIncludes: {
    "/tips": ["./content/tips/**/*"],
    "/tips/*": ["./content/tips/**/*"],
  },
};

export default nextConfig;
