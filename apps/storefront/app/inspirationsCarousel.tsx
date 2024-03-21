'use client';

import { Carousel } from '@couture-next/ui';
import { loader } from '../utils/next-image-directus-loader';
import { Home } from '../directus';

export function InspirationsCarousel({ inspirations }: { inspirations: Home['inspirations'] }) {
  return (
    <Carousel
      loader={loader}
      images={inspirations.map((inspiration) => ({
        url: inspiration.image.filename_disk,
        alt: '',
      }))}
    />
  );
}
