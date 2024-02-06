'use client';

import Image from 'next/image';
import { loader } from '../../utils/next-image-directus-loader';

export function PartnerImage(partner: { image: string; name: string }) {
  return (
    <Image
      src={partner.image}
      alt={partner.name}
      width={100}
      height={100}
      className="w-24 h-24 object-contain"
      loader={loader}
    />
  );
}
