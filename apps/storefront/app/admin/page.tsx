import { routes } from '@couture-next/routing';
import Link from 'next/link';
import HiddenLinks from './hiddenLinks';

export default function Page() {
  return (
    <>
      <h1 className="text-3xl font-serif text-center mb-8">Administration</h1>
      <ul className="border rounded-md shadow-md mx-auto max-w-md w-full">
        <li className="border-b py-4">
          <Link className="px-8 block" href={routes().admin().accounting().index()}>
            Comptabilité
          </Link>
        </li>
        <li className="border-b py-4">
          <Link className="px-8 block" href={routes().admin().orders().index()}>
            Commandes
          </Link>
        </li>
        <li className="border-b py-4">
          <Link className="px-8 block" href={routes().admin().products().index()}>
            Créations
          </Link>
        </li>
        <li className="border-b py-4">
          <Link className="px-8 block" href={routes().admin().seo().index()}>
            SEO
          </Link>
        </li>
        <li className="border-b py-4">
          <Link className="px-8 block" href={routes().admin().fabrics().index()}>
            Tissus
          </Link>
        </li>
        <li className="border-b py-4">
          <Link className="px-8 block" href={routes().admin().users().index()}>
            Fichiers clients
          </Link>
        </li>
        <li className="border-b py-4">
          <Link className="px-8 block" href={routes().admin().trackingLinks().index()}>
            Liens de tracking
          </Link>
        </li>
        <li className="border-b py-4">
          <Link className="px-8 block" href={routes().admin().promotionCodes().index()}>
            Codes promotionnels
          </Link>
        </li>
        <li className="border-b py-4">
          <Link className="px-8 block" href={routes().admin().pipings().index()}>
            Passepoils
          </Link>
        </li>
        <li className="border-b py-4">
          <Link className="px-8 block" href={routes().admin().embroideryColors().index()}>
            Couleurs pour broderies
          </Link>
        </li>
        <li className="border-b py-4">
          <Link className="px-8 block" href={routes().admin().workshopSessions().index()}>
            Ateliers
          </Link>
        </li>
      </ul>
      <HiddenLinks>
        <ul className="border rounded-md shadow-md mx-auto max-w-md w-full">
          <li className="border-b py-4">
            <Link className="px-8 block" href={routes().admin().articleThemes().index()}>
              Thèmes d'articles
            </Link>
          </li>
          <li className="border-b py-4">
            <Link className="px-8 block" href={routes().admin().fabricGroups().index()}>
              Groupes de tissus
            </Link>
          </li>
        </ul>
      </HiddenLinks>
    </>
  );
}
