'use client';

import { loader } from '../utils/next-image-directus-loader';

export default function HomeInfosBackground({ imageUid }: { imageUid: string }) {
  return (
    <div
      style={{
        backgroundImage: `url("${loader({
          src: imageUid,
          width: 512,
        })}")`,
        transform: 'translateZ(0)',
      }}
      className="opacity-30 fixed block top-0 left-0 w-full h-[100lvh] bg-cover bg-center will-change-transform"
    ></div>
  );
}
