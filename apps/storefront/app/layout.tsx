import '../assets/global.css';

import Footer from './footer';
import { Lobster, Inter } from 'next/font/google';
import { Metadata } from 'next';
import TopNav from './topNav';
import QueryClientWrapper from './QueryClientWrapper';
import { AuthProvider } from '../contexts/AuthContext';
import { PropsWithChildren } from 'react';
import Head from 'next/head';
import { CartPreview } from './cartPreview';
import { CartProvider } from '../contexts/CartContext';

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
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html
      lang="fr"
      className={serifFont.variable + ' ' + sansFont.variable}
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      <Head>
        <meta name="robots" content="noindex" />
      </Head>
      <body className="flex flex-col min-h-screen">
        <AuthProvider>
          <QueryClientWrapper>
            <CartProvider>
              <TopNav />
              <main className="flex-grow relative">{children}</main>
            </CartProvider>
          </QueryClientWrapper>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
