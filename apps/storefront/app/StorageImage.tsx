'use client';

import Image from 'next/image';
import { loader } from '../utils/next-image-firebase-storage-loader';
import { forwardRef } from 'react';

export const StorageImage = forwardRef((props, ref) => {
  return <Image {...props} loader={loader} ref={ref} />;
}) satisfies Omit<typeof Image, 'loader'>;
