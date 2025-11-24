/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",   // 🔥 REQUIRED for Azure Web App
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "static.cregis.io" },
      { protocol: "https", hostname: "flagcdn.com" },
      { protocol: "https", hostname: "cryptologos.cc" },
    ],
  },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

module.exports = nextConfig;
