import '../assets/global.css';

import Footer from './footer';
import { Lobster, Inter } from 'next/font/google';
import { Metadata } from 'next';
import TopNav from './topNav';
import QueryClientWrapper from './QueryClientWrapper';
import { AuthProvider } from '../contexts/AuthContext';
import { PropsWithChildren, Suspense } from 'react';
import { CartProvider } from '../contexts/CartContext';
import env from '../env';
import { PostHogPageview, PostHogProvider } from '../contexts/PostHog';
import { WithStructuedDataWrapper } from '@couture-next/ui';
import { structuredData } from '@couture-next/seo';
import { BlockBodyScrollContext, BlockBodyScrollContextProvider } from '../contexts/BlockBodyScrollContext';

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
  robots: 'noindex',
  metadataBase: new URL(env.BASE_URL),
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="fr" className={serifFont.variable + ' ' + sansFont.variable} style={{ fontFamily: 'var(--font-sans)' }}>
      <body className="flex flex-col min-h-screen">
        <Suspense>
          <PostHogPageview />
        </Suspense>
        <PostHogProvider>
          <BlockBodyScrollContextProvider>
            <QueryClientWrapper>
              <AuthProvider>
                <CartProvider>
                  <TopNav />
                  <WithStructuedDataWrapper stucturedData={structuredData.organization(env.BASE_URL)}>
                    <main className="flex-grow relative">{children}</main>
                  </WithStructuedDataWrapper>
                </CartProvider>
                <Footer />
              </AuthProvider>
            </QueryClientWrapper>
          </BlockBodyScrollContextProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
