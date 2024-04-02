'use client';

import Image from 'next/image';
import { loader } from '../utils/next-image-firebase-storage-loader';
import { forwardRef } from 'react';
import { shouldBeInCdn } from '@couture-next/utils';
import env from '../env';

export const StorageImage = forwardRef((props, ref) => {
  if (typeof props.src === 'string' && !props.src.startsWith('http') && shouldBeInCdn(props.src)) {
    props.src = new URL(props.src, env.CDN_BASE_URL).toString();
  }
  return <Image {...props} loader={loader} ref={ref} />;
}) satisfies Omit<typeof Image, 'loader'>;
