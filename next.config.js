/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "static.cregis.io" },
      { protocol: "https", hostname: "flagcdn.com" },
      { protocol: "https", hostname: "cryptologos.cc" },
      { protocol: "http", hostname: "localhost", port: "5003" },
      { protocol: "http", hostname: "127.0.0.1", port: "5003" },
      { protocol: "https", hostname: "zupback.zuperior.com" },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
