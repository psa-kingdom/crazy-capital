import { MetadataRoute } from 'next';
import { SERVICE_VERTICALS } from '../data/service-verticals';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://crazycapital.in';

  // Core static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  // 14 Service Verticals
  const servicePages: MetadataRoute.Sitemap = SERVICE_VERTICALS.map((service) => ({
    url: `${baseUrl}/services/${service.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.95,
  }));

  // Dynamic Blog Posts
  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch('http://localhost:4000/api/v1/cms/posts?limit=100', {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.data && Array.isArray(data.data)) {
        blogPages = data.data.map((post: any) => ({
          url: `${baseUrl}/blog/${post.slug}`,
          lastModified: new Date(post.updatedAt || post.publishedAt || post.createdAt),
          changeFrequency: 'monthly',
          priority: 0.8,
        }));
      }
    }
  } catch (err) {
    // Graceful fallback
  }

  return [...staticPages, ...servicePages, ...blogPages];
}
