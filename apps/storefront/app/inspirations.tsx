import { WithDecorativeDotsWrapper } from '@couture-next/ui';
import { Home, fetchFromCMS } from '../directus';
import { routes } from '@couture-next/routing';
import Link from 'next/link';
import { InspirationsCarousel } from './inspirationsCarousel';

export async function Inspirations() {
  const cmsHome = await fetchFromCMS<Home>('home', { fields: '*.*.*' });

  return (
    <div className="pb-12 bg-white">
      <div className="triangle-bottom bg-light-100"></div>
      <div className="bg-white pt-8">
        <WithDecorativeDotsWrapper dotsPosition={['top-right', 'bottom-left']} dotsClassName="opacity-50 z-0">
          <h2 className="text-center text-4xl font-serif mb-8">Galerie Photos</h2>
          <div className="relative z-10 py-4">
            <InspirationsCarousel inspirations={cmsHome.inspirations} />
          </div>
          <Link className="btn-primary mx-auto mt-4" href={routes().shop().index()}>
            Voir la boutique
          </Link>
        </WithDecorativeDotsWrapper>
      </div>
    </div>
  );
}
