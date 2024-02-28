'use client';

import Image from 'next/image';
import { loader } from '../utils/next-image-directus-loader';

export default function HomeInfosBackground({ imageUid }: { imageUid: string }) {
  return (
    <div className="opacity-30 fixed block top-0 left-0 w-full h-[100lvh]">
      <Image
        loader={loader}
        src={imageUid}
        layout="fill"
        alt=""
        sizes="110vw"
        className="object-cover object-right sm:object-center"
        style={{ transform: 'translateZ(0) scale(1.1)' }}
      />
    </div>
  );
}
