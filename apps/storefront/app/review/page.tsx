import { firebaseServerImageLoader as loader, generateMetadata as prepareMetadata } from '@couture-next/utils';
import { notFound } from 'next/navigation';
import ReviewsSection from './ReviewsSections';
import { BreadCrumbsNav, WithStructuedDataWrapper } from '@couture-next/ui';
import { routes } from '@couture-next/routing';
import { structuredData } from '@couture-next/seo';
import Link from 'next/link';
import env from '../../env';
import { trpc } from 'apps/storefront/trpc-server';
import { TRPCClientError } from '@trpc/client';

export const generateMetadata = async () => {
  return prepareMetadata({
    title: 'Tous nos avis clients',
    alternates: { canonical: routes().index() },
    description: 'Découvrez les avis de nos clients sur nos produits et services.',
    openGraph: {
      locale: 'fr_FR',
      url: routes().index(),
      siteName: 'Petit Roudoudou',
      title: 'Tous nos avis clients',
      description: 'Découvrez les avis de nos clients sur nos produits et services.',
    },
  });
};

export default async function Page() {
  const breadCrumbs = [{ label: 'Accueil', href: routes().index() }];

  return (
    <>
      <div className="flex justify-center mt-8">
        <BreadCrumbsNav Link={Link} ariaLabel="Navigation dans la boutique" items={breadCrumbs} />
      </div>
      <div className="flex justify-center p-6 text-3xl font-serif">Retrouvez Tous nos Avis clients</div>
      <ReviewsSection />
    </>
  );
}
