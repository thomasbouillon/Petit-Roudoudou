'use client';

import Image from 'next/image';
import { Nav } from '@couture-next/ui';
import Link from 'next/link';
import { routes } from '@couture-next/routing';

export default function Footer() {
  return (
    <footer className="pt-4 print:hidden">
      <div className="px-4">
        <div className="max-w-md mx-auto relative aspect-[511/124]">
          <Image src="/images/brand.webp" fill alt="Slogan: Petit Roudoudou, aussi unique que votre bébé." />
        </div>
      </div>
      <div className="relative sm:aspect-[375/26] flex items-center">
        <Link
          className="mt-4 mx-auto btn-primary z-10 relative translate-y-1/2 sm:translate-y-0"
          href={routes().shop().index({ customizableOnly: true })}
        >
          Personnalisez une création
        </Link>
        <div className="sm:triangle-top bg-light-100 absolute w-full bottom-0" />
      </div>
      <div className="flex flex-col items-center bg-light-100 pt-8 sm:pt-0">
        <Nav
          items={[
            { label: 'Accueil', href: routes().index() },
            { label: 'Boutique', href: routes().shop().index() },
            { label: 'Tissus', href: routes().fabrics().index() },
            { label: 'Evènements', href: routes().events().index() },
            { label: 'Contact', href: routes().contactUs() },
            {
              label: 'Foire aux questions',
              href: routes().faq().index(),
            },
            { label: 'Mentions légales', href: '#TODO2' },
            {
              label: 'Politique de confidentialité',
              href: '#TODO3',
            },
            {
              label: 'Conditions générales de vente',
              href: '#TODO4',
            },
          ]}
          Link={Link}
          className="mt-5"
        />
      </div>
    </footer>
  );
}
