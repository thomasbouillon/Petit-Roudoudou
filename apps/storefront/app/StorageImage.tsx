'use client';

import Image from 'next/image';
import { loader } from '../utils/next-image-firebase-storage-loader';
import { forwardRef } from 'react';
import { shouldBeInCdn } from '@couture-next/utils';
import env from '../env';

export const StorageImage = forwardRef((props, ref) => {
  let src = props.src;
  if (typeof props.src === 'string' && !props.src.startsWith('http') && shouldBeInCdn(props.src)) {
    src = new URL(props.src, env.CDN_BASE_URL).toString();
  }
  return <Image {...props} src={src} loader={loader} ref={ref} />;
}) satisfies Omit<typeof Image, 'loader'>;
