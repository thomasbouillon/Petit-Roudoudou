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
    <html
      lang="fr"
      className={serifFont.variable + ' ' + sansFont.variable}
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      <body className="flex flex-col min-h-screen">
        <QueryClientWrapper>
          <AuthProvider>
            <CartProvider>
              <TopNav />
              <main className="flex-grow relative">{children}</main>
            </CartProvider>
            <Footer />
          </AuthProvider>
        </QueryClientWrapper>
      </body>
    </html>
  );
}
