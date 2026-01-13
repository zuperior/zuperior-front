/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",   // <-- required for Azure
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "static.cregis.io" },
      { protocol: "https", hostname: "flagcdn.com" },
      { protocol: "https", hostname: "cryptologos.cc" },
      { protocol: "http", hostname: "localhost", port: "5003" },
      { protocol: "http", hostname: "127.0.0.1", port: "5003" },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  }
};

module.exports = nextConfig;
