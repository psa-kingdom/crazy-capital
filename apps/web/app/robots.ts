import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/customer/', '/employee/', '/admin/'],
    },
    sitemap: 'https://crazycapital.in/sitemap.xml',
  };
}
