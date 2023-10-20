import Image from 'next/image';
import { Nav } from '@couture-next/ui';
import Link from 'next/link';

export default function Footer() {
  return (
    <>
      <footer className="flex flex-col items-center bg-light-100 mt-8 pt-4">
        <Image
          src="/images/logo.png"
          width={100}
          height={100}
          alt="Logo de Ptit roudoudou"
        />
        <Link className="mt-4 btn-primary" href="/personnaliser">
          Personnalisez une création
        </Link>
        <Nav
          items={[
            { label: 'Accueil', href: '/' },
            { label: 'Boutique', href: '/boutique' },
            { label: 'Tissus', href: '/tissus' },
            { label: 'Contact', href: '/contact' },
            { label: 'Mentions légales', href: '/mentions-legales' },
            {
              label: 'Politique de confidentialité',
              href: '/politique-de-confidentialite',
            },
            {
              label: 'Conditions générales de vente',
              href: '/conditions-generales-de-vente',
            },
          ]}
          Link={Link}
          className="mt-5"
        />
      </footer>
    </>
  );
}
