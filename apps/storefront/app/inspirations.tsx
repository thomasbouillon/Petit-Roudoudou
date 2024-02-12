'use client';

import { Carousel, StyledWrapper, WithDecorativeDotsWrapper } from '@couture-next/ui';
import { useQuery } from '@tanstack/react-query';
import { Home, fetchFromCMS } from '../directus';
import { loader } from '../utils/next-image-directus-loader';
import { routes } from '@couture-next/routing';
import Link from 'next/link';

export function Inspirations() {
  const getInspirationsQuery = useQuery({
    queryKey: ['cms', 'home'],
    queryFn: () => fetchFromCMS<Home>('home', { fields: '*.*.*' }),
  });
  if (getInspirationsQuery.isError) throw getInspirationsQuery.error;

  if (getInspirationsQuery.isPending) {
    return null;
  }

  return (
    <div className="pb-12 bg-white">
      <div className="triangle-bottom bg-light-100"></div>
      <div className="bg-white pt-12">
        <WithDecorativeDotsWrapper dotsPosition={['top-right', 'bottom-left']} dotsClassName="opacity-50 z-0">
          <h2 className="text-center text-4xl font-serif mb-8">Galerie Photos</h2>
          <div className="relative z-10 py-4">
            <Carousel
              loader={loader}
              images={getInspirationsQuery.data.inspirations.map((inspiration) => ({
                url: inspiration.image.filename_disk,
                alt: '',
              }))}
            />
          </div>
          <Link className="btn-primary mx-auto mt-4" href={routes().shop().index()}>
            Voir la boutique
          </Link>
        </WithDecorativeDotsWrapper>
      </div>
    </div>
  );
}
