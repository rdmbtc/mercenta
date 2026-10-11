import type { MetadataRoute } from 'next';

const BASE = 'https://mercenta.xyz';

// Public routes only. /app (merchant console) and /api are excluded.
const ROUTES: Array<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
}> = [
  { path: '/', priority: 1.0, changeFrequency: 'weekly' },
  { path: '/catalog', priority: 0.9, changeFrequency: 'daily' },
  { path: '/start', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/earn', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/demo', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/api-docs', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/agent', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/operations', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/releases', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/refund', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/support', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/status', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/privacy', priority: 0.5, changeFrequency: 'yearly' },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((r) => ({
    url: `${BASE}${r.path}`,
    lastModified: new Date(),
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
