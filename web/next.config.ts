import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Resolve the app host before the static marketing page; preserve the landing on other hosts.
  async rewrites() {
    return {beforeFiles: [{source: '/', has: [{type: 'host' as const, value: 'app.mercenta.xyz'}], destination: '/app'}]};
  },
  turbopack: {root: path.resolve(__dirname)},
  typescript: {ignoreBuildErrors: false},
  eslint: {ignoreDuringBuilds: false},
};
export default nextConfig;
