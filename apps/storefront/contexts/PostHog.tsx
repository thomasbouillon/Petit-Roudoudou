'use client';

import posthog, { Properties } from 'posthog-js';
import { PostHogProvider as BasePostHogProvider } from 'posthog-js/react';
import { usePathname, useSearchParams } from 'next/navigation';
import React, { useCallback, useEffect } from 'react';
import env from '../env';
import { isbot } from 'isbot';
import clsx from 'clsx';
import Link from 'next/link';
import { useReportWebVitals } from 'next/web-vitals';

if (typeof window !== 'undefined' && env.POSTHOG_ENABLED && !isbot(window.navigator.userAgent)) {
  posthog.init(env.POSTHOG_API_KEY, {
    api_host: env.POSTHOG_HOST,
    capture_pageview: false, // Disable automatic pageview capture, as we capture manually
    persistence: 'localStorage',
    session_recording: {
      maskTextSelector:
        '*[data-posthog-recording-masked], #brevo-conversations .chat-bubble, #brevo-conversations form',
    },
  });
}

export function PostHogPageview() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname) {
      let url = window.origin + pathname;
      if (searchParams && searchParams.toString()) {
        url = url + `?${searchParams.toString()}`;
      }

      const toCapture: Properties = {
        $current_url: url,
      };

      // Capture pageview
      posthog.capture('$pageview', toCapture);
    }
  }, [pathname, searchParams]);

  // Already asked consent or not applicable
  const shouldRenderCookieBanner = !(
    posthog.has_opted_in_capturing() ||
    posthog.has_opted_out_capturing() ||
    typeof window === 'undefined' ||
    isbot(window.navigator.userAgent) ||
    !env.POSTHOG_ENABLED
  );

  return (
    <>
      {shouldRenderCookieBanner && <CookieBanner />}
      <WebVitals />
    </>
  );
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return <BasePostHogProvider client={posthog}>{children}</BasePostHogProvider>;
}

const WebVitals = () => {
  useReportWebVitals((metric) => {
    posthog.capture(metric.name, metric);
  });
  return null;
};

const CookieBanner: React.FC = () => {
  const [hidden, setHidden] = React.useState(false);

  const accept = useCallback(() => {
    posthog.opt_in_capturing();
    setHidden(true);
  }, [setHidden]);
  const decline = useCallback(() => {
    posthog.opt_out_capturing();
    setHidden(true);
  }, [setHidden]);

  if (hidden) return null;

  return (
    <div
      className={clsx(
        'fixed bottom-0 sm:bottom-4 left-1/2 -translate-x-1/2 z-20',
        'w-full max-w-md p-4',
        'bg-white border rounded-md'
      )}
    >
      <div className="text-sm mb-2">
        <p className="font-bold">Nous sommes transparents sur le traitement de vos données personnelles.</p>
        <p>
          Nous ne vendons pas tes données à des tiers. Nous effectuons des statistiques annonymes sur le site pour
          suivre les performances et améliorer notre site internet. Pour celà nous sommes amenés à utiliser/transmettre
          des informations telles que: adresse, type de navigateur, addresse IP, page visitées avec notre outil de
          statistiques:{' '}
          <Link href="https://posthog.com/privacy" className="underline">
            Posthog
          </Link>
          .
        </p>
      </div>
      <div className="grid gap-4 grid-cols-2 max-w-sm mx-auto items-center justify-center">
        <button onClick={decline} className="mx-auto">
          Refuser
        </button>
        <button onClick={accept} className="btn-primary">
          Accepter
        </button>
      </div>
    </div>
  );
};
