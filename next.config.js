/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["lkjgardensigando.com"],
  },
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/home",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
