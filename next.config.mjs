import createNextIntlPlugin from 'next-intl/plugin';

// Point the plugin to our next-intl config file
const withNextIntl = createNextIntlPlugin('./next-intl.config.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    // Keep defaults; add experimental flags if needed later
  }
};

export default withNextIntl(nextConfig);

