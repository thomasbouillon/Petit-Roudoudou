'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { Home, fetchFromCMS } from '../directus';
import Image from 'next/image';
import { loader } from '../utils/next-image-directus-loader';
import Link from 'next/link';

export function LinksFromCMS() {
  const getCMSLinksQuery = useSuspenseQuery({
    queryKey: ['cms', 'home'],
    queryFn: () => fetchFromCMS<Home>('home', { fields: '*.*.*' }),
  });

  if (getCMSLinksQuery.isError) throw getCMSLinksQuery.error;

  return (
    <div className="flex flex-col max-w-lg px-4 gap-2 mx-auto">
      {getCMSLinksQuery.data.links.map((link) => (
        <div className="aspect-[350/120] relative flex items-center justify-center" key={link.label}>
          <Image
            src={link.image.filename_disk}
            alt=""
            loader={loader}
            fill
            className="object-center object-cover"
            placeholder={link.image_placeholder ? 'blur' : undefined}
            blurDataURL={link.image_placeholder}
          />
          <Link className="btn-primary z-10 min-w-56 text-center" href={link.href}>
            {link.label}
          </Link>
        </div>
      ))}
    </div>
  );
}
