export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aethercraft.dev';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/pricing',
          '/templates',
          '/showcase',
          '/docs',
          '/integrations',
          '/changelog',
        ],
        disallow: [
          '/studio',
          '/dashboard',
          '/checkout',
          '/api/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
