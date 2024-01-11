import News from './news';
import NewsPlaceholder from './newsPlaceholder';
import { generateMetadata } from '@couture-next/utils';
import { Suspense } from 'react';
import { Inspirations } from './inspirations';
import { LinksFromCMS } from './linksFromCMS';
import { LinksFromCMSPlaceholder } from './linksFromCMSPlaceholder';
import { HomeInfos } from './homeInfos';
import { ArticleShowcase } from './articleShowcase';
import { ArticleShowcasePlaceholder } from './articleShowcasePlaceholder';
import { ErrorBoundary } from 'react-error-boundary';
import { NewsletterSection } from './newsLetterSection';

export const metadata = generateMetadata({
  description:
    'Explorez l&apos;univers Petit Roudoudou et créez des articles de puériculture Made in France, uniques, 100% personnalisables pour votre enfant. Choisissez parmi notre large gamme de tissu pour rendre votre création unique.',
});

export default function Page() {
  return (
    <div className="bg-light-100">
      <div className="flex flex-col-reverse pb-4">
        <h1 className="font-serif text-4xl text-center px-8 py-16 text-pretty">
          Créez l&apos;univers de votre enfant en quelques clics !
        </h1>
        <Suspense fallback={<NewsPlaceholder />}>
          <News />
        </Suspense>
      </div>
      <Suspense fallback={<LinksFromCMSPlaceholder />}>
        <LinksFromCMS />
      </Suspense>
      <div className="mt-20">
        <Suspense
          fallback={
            <div className="placeholder w-full h-[50vh]">
              <p className="sr-only">Chargement des informations importantes</p>
            </div>
          }
        >
          {<HomeInfos />}
        </Suspense>
      </div>
      <div className="mt-20 px-4 pb-12">
        <h2 className="text-4xl font-serif text-center mb-12">Vos coups de coeur du mois</h2>
        <ErrorBoundary fallback={<p>Erreur lors du chargement des articles</p>}>
          <Suspense fallback={<ArticleShowcasePlaceholder />}>{<ArticleShowcase />}</Suspense>
        </ErrorBoundary>
      </div>
      <Inspirations />
      <div className="bg-white mb-16">
        <NewsletterSection />
      </div>
    </div>
  );
}
