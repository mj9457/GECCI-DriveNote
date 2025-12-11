import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // allow external hosts used by the app for logos/icons
    domains: ['gecci.korcham.net', 'www.gstatic.com'],
  },
};

export default nextConfig;
