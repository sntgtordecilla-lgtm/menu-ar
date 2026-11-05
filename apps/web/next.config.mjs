/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@menu-ar/shared'],
  async headers() {
    return [
      {
        source: '/models/tarta.usdz',
        headers: [{ key: 'Content-Type', value: 'model/vnd.usdz+zip' }],
      },
    ];
  },
};

export default nextConfig;
