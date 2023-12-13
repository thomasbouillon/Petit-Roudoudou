'use client';
import posthog from 'posthog-js';
import { PostHogProvider as BasePostHogProvider } from 'posthog-js/react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import env from '../env';

if (typeof window !== 'undefined' && env.POSTHOG_ENABLED) {
  posthog.init(env.POSTHOG_API_KEY, {
    api_host: env.POSTHOG_HOST,
    capture_pageview: false, // Disable automatic pageview capture, as we capture manually
  });
}

export function PostHogPageview(): JSX.Element {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname) {
      let url = window.origin + pathname;
      if (searchParams && searchParams.toString()) {
        url = url + `?${searchParams.toString()}`;
      }
      posthog.capture('$pageview', {
        $current_url: url,
      });
    }
  }, [pathname, searchParams]);

  return <></>;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return <BasePostHogProvider client={posthog}>{children}</BasePostHogProvider>;
}
