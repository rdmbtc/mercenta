import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Resolve the app host before the static marketing page; preserve the landing on other hosts.
  async rewrites() {
    return {beforeFiles: [{source: '/', has: [{type: 'host' as const, value: 'app.mercenta.xyz'}], destination: '/app'}]};
  },
  // Only public, credential-free catalogue reads and the read-only SDK are embeddable.
  async headers() { return [{source:'/sdk/:path*',headers:[{key:'Access-Control-Allow-Origin',value:'*'},{key:'X-Content-Type-Options',value:'nosniff'}]},{source:'/onramp',headers:[{key:'Content-Security-Policy',value:"frame-src https://onramp.arc.io https://onramp-sandbox.arc.io; connect-src 'self' https://onramp.arc.io https://onramp-sandbox.arc.io https://api.circle.com https://api-test.circle.com; object-src 'none'; base-uri 'self'; frame-ancestors 'self'"},{key:'Referrer-Policy',value:'no-referrer'},{key:'X-Content-Type-Options',value:'nosniff'}]}]; },
  turbopack: {root: path.resolve(__dirname)},
  typescript: {ignoreBuildErrors: false},
  eslint: {ignoreDuringBuilds: false},
};
export default nextConfig;
