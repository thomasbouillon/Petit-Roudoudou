'use client';
import posthog, { Properties } from 'posthog-js';
import { PostHogProvider as BasePostHogProvider } from 'posthog-js/react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import env from '../env';
import { useCart } from './CartContext';

if (typeof window !== 'undefined' && env.POSTHOG_ENABLED) {
  posthog.init(env.POSTHOG_API_KEY, {
    api_host: env.POSTHOG_HOST,
    capture_pageview: false, // Disable automatic pageview capture, as we capture manually
    persistence: 'localStorage',
    session_recording: {
      maskTextSelector: '*[data-posthog-recording-masked]',
    },
  });
}

export function PostHogPageview(): JSX.Element {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const prevItemsCount = useRef<number | null>(null);
  const { getCartQuery } = useCart();

  useEffect(() => {
    if (pathname) {
      let url = window.origin + pathname;
      if (searchParams && searchParams.toString()) {
        url = url + `?${searchParams.toString()}`;
      }

      const toCapture: Properties = {
        $current_url: url,
      };

      // side effect, attach cart items count to profile
      const cartItemCount = getCartQuery.data?.items.length ?? 0;
      if (!getCartQuery.isPending && prevItemsCount.current !== cartItemCount) {
        toCapture.$set = {
          cartItemCount,
        };
        prevItemsCount.current = cartItemCount;
      }

      // Capture pageview
      posthog.capture('$pageview', toCapture);
    }
  }, [pathname, searchParams]);

  return <></>;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return <BasePostHogProvider client={posthog}>{children}</BasePostHogProvider>;
}
