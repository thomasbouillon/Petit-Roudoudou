'use client';

import Link from 'next/link';
import { routes } from '@couture-next/routing';
import Image from 'next/image';
import React from 'react';
import { Piping } from '@prisma/client';
import { loader } from 'apps/storefront/utils/next-image-firebase-storage-loader';
import { trpc } from 'apps/storefront/trpc-client';

export default function Page() {
  const { data: pipings, error } = trpc.pipings.list.useQuery();
  if (error) throw error;

  if (pipings === undefined) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-3xl font-serif text-center mb-8">Passepoils</h1>
      <Link href={routes().admin().pipings().new()} className="btn-primary text-center mx-auto">
        Ajouter un passepoil
      </Link>
      <PipingList pipings={pipings} />
    </div>
  );
}

const PipingList: React.FC<{ pipings: Piping[] }> = ({ pipings }) => {
  return (
    <div className="border rounded-md shadow-md max-w-md mx-auto pb-8 mt-8">
      <ul>
        {pipings.map((piping) => (
          <li key={piping.id} className="border-b">
            <Link
              className="px-8 flex items-center gap-8 py-2"
              href={routes().admin().pipings().piping(piping.id).edit()}
            >
              <Image
                src={piping.image.url}
                alt=""
                width={64}
                height={64}
                className="w-16 h-16 object-cover"
                blurDataURL={piping.image.placeholderDataUrl ?? undefined}
                placeholder={piping.image.placeholderDataUrl ? 'blur' : undefined}
                loader={loader}
              />
              <p>{piping.name}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};
