'use client';

import Link from 'next/link';
import { routes } from '@couture-next/routing';
import Image from 'next/image';
import React from 'react';
import { EmbroideryColor } from '@prisma/client';
import { loader } from 'apps/storefront/utils/next-image-firebase-storage-loader';
import { trpc } from 'apps/storefront/trpc-client';

export default function Page() {
  const { data: embroideryColors, error } = trpc.embroideryColors.list.useQuery();
  if (error) throw error;

  if (embroideryColors === undefined) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-3xl font-serif text-center mb-8">Fils pour les Broderies</h1>
      <Link href={routes().admin().embroideryColors().new()} className="btn-primary text-center mx-auto">
        Ajouter une couleur
      </Link>
      <EmbroideryColorList embroideryColors={embroideryColors} />
    </div>
  );
}

const EmbroideryColorList: React.FC<{ embroideryColors: EmbroideryColor[] }> = ({ embroideryColors }) => {
  return (
    <div className="border rounded-md shadow-md max-w-md mx-auto pb-8 mt-8">
      <ul>
        {embroideryColors.map((embroideryColor) => (
          <li key={embroideryColor.id} className="border-b">
            <Link
              className="px-8 flex items-center gap-8 py-2"
              href={routes().admin().embroideryColors().embroideryColor(embroideryColor.id).edit()}
            >
              <Image
                src={embroideryColor.image.url}
                alt=""
                width={64}
                height={64}
                className="w-16 h-16 object-cover"
                blurDataURL={embroideryColor.image.placeholderDataUrl ?? undefined}
                placeholder={embroideryColor.image.placeholderDataUrl ? 'blur' : undefined}
                loader={loader}
              />
              <p>{embroideryColor.name}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};
