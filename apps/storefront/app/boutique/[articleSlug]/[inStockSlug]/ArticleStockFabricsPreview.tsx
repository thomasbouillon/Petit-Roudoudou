'use client';

import { trpc } from 'apps/storefront/trpc-client';
import { loader } from 'apps/storefront/utils/next-image-firebase-storage-loader';
import Image from 'next/image';
import { CSSProperties, Suspense } from 'react';

type Props = {
  fabricIds: string[];
};

export default function ArticleStockFabricsPreview(props: Props) {
  console.log(props.fabricIds);
  if (!props.fabricIds?.length) return null;

  return (
    <Suspense fallback={<Placeholder fabricCount={props.fabricIds.length} />}>
      <Preview {...props} />
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
          alt=""
          src={fabric.image.url}
          loader={loader}
          width={64}
          height={64}
          className="w-full h-full object-cover"
        />
      ))}
    </div>
  );
}
