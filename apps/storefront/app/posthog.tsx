'use client';

import dynamic from 'next/dynamic';

export const PostHogPageview = dynamic(
  () =>
    import('../contexts/PostHog').then((bundle) => {
      return bundle.PostHogPageview;
    }),
  {
    ssr: false,
  }
);
