'use client';

import { PhotoIcon } from '@heroicons/react/24/solid';
import { trpc } from 'apps/storefront/trpc-client';
import { loader } from 'apps/storefront/utils/next-image-firebase-storage-loader';
import Image from 'next/image';
import { CSSProperties, Suspense } from 'react';

type Props = {
  fabricIds: string[];
};

export default function ArticleStockFabricsPreview({ fabricIds }: Props) {
  return (
    <Suspense fallback={<Placeholder fabricCount={fabricIds?.length ?? 1} />}>
      <Preview fabricIds={fabricIds ?? []} />
    </Suspense>
  );
}

function Placeholder({ fabricCount }: { fabricCount: number }) {
  return (
    <div
      className="aspect-square grid grid-cols-[repeat(var(--columnCount),minmax(0,64px))] placeholder"
      style={{ '--columnCount': fabricCount } as CSSProperties}
    >
      {Array.from({ length: fabricCount }).map((_, i) => (
        <div key={i} className="w-full h-full bg-gray-200" />
      ))}
    </div>
  );
}

function Preview({ fabricIds }: Props) {
  const [fabrics] = trpc.useSuspenseQueries((trpc) => fabricIds.map((fabricId) => trpc.fabrics.findById(fabricId)));

  return (
    <div
      className="aspect-square grid grid-cols-[repeat(var(--columnCount),minmax(0,64px))]"
      style={{ '--columnCount': fabricIds.length } as CSSProperties}
    >
      {fabrics.map((fabric) => (
        <Image
          key={fabric.id}
          alt="?"
          src={fabric.previewImage?.url ?? fabric.image.url}
          loader={loader}
          width={64}
          height={64}
          className="w-full h-full object-cover"
        />
      ))}
      {fabricIds.length === 0 && (
        <div className="w-full h-full bg-white flex items-center justify-center relative">
          <PhotoIcon className="w-8 h-8 text-gray-400" />
          <div className="absolute h-1 w-1/3 top-1/2 left-1/2 -translate-x-1/2 bg-gray-600 scale-y-50 -rotate-45 -translate-y-1/2"></div>
          <div className="absolute h-1 w-1/3 top-1/2 left-1/2 -translate-x-1/2 bg-gray-600 scale-y-50 rotate-45 -translate-y-1/2"></div>
        </div>
      )}
    </div>
  );
}
