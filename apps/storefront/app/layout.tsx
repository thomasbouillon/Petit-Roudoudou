import '../assets/global.css';

import Footer from './footer';
import { Lobster, Inter } from 'next/font/google';
import { Metadata } from 'next';
import TopNav from './topNav';
import QueryClientWrapper from './QueryClientWrapper';
import { AuthProvider } from '../contexts/AuthContext';
import { PropsWithChildren } from 'react';
import { CartProvider } from '../contexts/CartContext';
import env from '../env';
import { WithStructuedDataWrapper } from '@couture-next/ui';
import { structuredData } from '@couture-next/seo';
import { BlockBodyScrollContextProvider } from '../contexts/BlockBodyScrollContext';
import { Toaster } from 'react-hot-toast';
import LiveChat from './LiveChat';
import { TrpcClientProvider } from '../contexts/TrpcClientProvider';
import clsx from 'clsx';
import { PostHogPageview } from './posthog';

const serifFont = Lobster({
  weight: ['400'],
  subsets: ['latin-ext'],
  variable: '--font-serif',
});

const sansFont = Inter({
  weight: ['400', '700'],
  subsets: ['latin-ext'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  metadataBase: new URL(env.BASE_URL),
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html
      lang="fr"
      className={clsx(serifFont.variable, sansFont.variable, 'scroll-smooth')}
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      <head>
        <link rel="preconnect" href="https://api.petit-roudoudou.fr" />
        <link rel="preconnect" href="https://static.petit-roudoudou.fr" />
        <link rel="dns-prefetch" href="https://api.petit-roudoudou.fr" />
        <link rel="dns-prefetch" href="https://static.petit-roudoudou.fr" />
      </head>
      <body className="flex flex-col min-h-screen">
        <Toaster position="bottom-right" />
        <QueryClientWrapper>
          <TrpcClientProvider>
            {/* <PostHogProvider> */}
            <BlockBodyScrollContextProvider>
              <AuthProvider>
                <CartProvider>
                  <PostHogPageview />
                  <TopNav />
                  <WithStructuedDataWrapper stucturedData={structuredData.organization(env.BASE_URL)}>
                    <main className="flex-grow relative">{children}</main>
                  </WithStructuedDataWrapper>
                </CartProvider>
                <LiveChat />
                <Footer />
              </AuthProvider>
            </BlockBodyScrollContextProvider>
            {/* </PostHogProvider> */}
          </TrpcClientProvider>
        </QueryClientWrapper>
      </body>
    </html>
  );
}
