import { MetadataRoute } from 'next';
import env from '../env';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      disallow: '/',
      // TODO
      // allow: '/'
      // disallow: '/admin',
    },
    sitemap: [
      env.BASE_URL + '/sitemap.xml',
      env.BASE_URL + '/boutique/sitemap.xml',
      env.BASE_URL + '/blog/sitemap.xml',
    ],
  };
}
