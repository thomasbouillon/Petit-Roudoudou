'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { Home, fetchFromCMS } from '../directus';
import Image from 'next/image';
import { loader } from '../utils/next-image-directus-loader';
import Link from 'next/link';
import { WithDecorativeDotsWrapper } from '@couture-next/ui';

export function LinksFromCMS() {
  const getCMSLinksQuery = useSuspenseQuery({
    queryKey: ['cms', 'home'],
    queryFn: () => fetchFromCMS<Home>('home', { fields: '*.*.*' }),
  });

  if (getCMSLinksQuery.isError) throw getCMSLinksQuery.error;

  return (
    <WithDecorativeDotsWrapper dotsPosition="top-right">
      <div className="grid grid-cols-2 max-w-lg px-4 gap-2 mx-auto">
        {getCMSLinksQuery.data.links.map((link) => (
          <div
            className="aspect-square first:aspect-[2/1] first:col-span-2 relative flex items-center justify-center"
            key={link.label}
          >
            <Image
              src={link.image.filename_disk}
              alt=""
              loader={loader}
              fill
              className="object-center object-cover"
              placeholder={link.image_placeholder ? 'blur' : undefined}
              blurDataURL={link.image_placeholder}
            />
            <Link className="btn-primary z-10 w-52 text-center !px-0" href={link.href}>
              {link.label}
            </Link>
          </div>
        ))}
      </div>
    </WithDecorativeDotsWrapper>
  );
}
