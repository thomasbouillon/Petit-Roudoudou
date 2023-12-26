'use client';

import Image from 'next/image';
import { Nav } from '@couture-next/ui';
import Link from 'next/link';
import { routes } from '@couture-next/routing';

export default function Footer() {
  return (
    <footer className="flex flex-col items-center bg-light-100 mt-8 pt-4 print:hidden">
      <Image src="/images/logo.png" width={100} height={100} alt="Logo de Ptit roudoudou" />
      <Link className="mt-4 btn-primary" href={routes().shop().index()}>
        Personnalisez une création
      </Link>
      <Nav
        items={[
          { label: 'Accueil', href: routes().index() },
          { label: 'Boutique', href: routes().shop().index() },
          { label: 'Tissus', href: routes().fabrics().index() },
          { label: 'Evènements', href: routes().events().index() },
          { label: 'Contact', href: '#TODO1' },
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
    </footer>
  );
}
