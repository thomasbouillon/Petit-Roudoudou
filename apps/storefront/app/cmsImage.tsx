'use client';

import Image from 'next/image';
import { loader } from '../utils/next-image-directus-loader';
import { forwardRef } from 'react';

export const CmsImage = forwardRef((props, ref) => {
  return <Image {...props} loader={loader} ref={ref} />;
}) satisfies Omit<typeof Image, 'loader'>;
