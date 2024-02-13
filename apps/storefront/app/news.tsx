import React from 'react';
import { Home, fetchFromCMS } from '../directus';
import NewsCarousel from './newsCarousel';

export default async function News() {
  const cmsHome = await fetchFromCMS<Home>('home', { fields: '*.*.*' });

  return (
    <div>
      <h2 className="sr-only">Nouveautés</h2>
      <NewsCarousel news={cmsHome.news} />
    </div>
  );
}
