import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Resolve the app host before the static marketing page; preserve the landing on other hosts.
  async rewrites() {
    return {beforeFiles: [{source: '/', has: [{type: 'host' as const, value: 'app.mercenta.xyz'}], destination: '/app'}]};
  },
  // Only public, credential-free catalogue reads and the read-only SDK are embeddable.
  async headers() { return [{source:'/sdk/:path*',headers:[{key:'Access-Control-Allow-Origin',value:'*'},{key:'X-Content-Type-Options',value:'nosniff'}]}]; },
  turbopack: {root: path.resolve(__dirname)},
  typescript: {ignoreBuildErrors: false},
  eslint: {ignoreDuringBuilds: false},
};
export default nextConfig;
