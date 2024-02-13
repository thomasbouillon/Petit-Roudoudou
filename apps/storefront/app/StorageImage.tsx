'use client';

import Image from 'next/image';
import { loader } from '../utils/next-image-firebase-storage-loader';
import { forwardRef } from 'react';

export const StorageImage = forwardRef((props) => {
  return <Image {...props} loader={loader} />;
}) satisfies Omit<typeof Image, 'loader'>;
