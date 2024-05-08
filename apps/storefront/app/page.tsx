import News from './news';
import { generateMetadata } from '@couture-next/utils';
import { LinksFromCMS } from './linksFromCMS';
import { HomeInfos } from './homeInfos';
import { NewsletterSection } from './newsLetterSection';
import InfoBannerFromCms from './InfoBannerFromCms';
import { CategoriesCarousel } from './CategoriesCarousel';
import { routes } from '@couture-next/routing';
import { ArticleCarousels } from './articleCarousels';
import Link from 'next/link';

export const metadata = generateMetadata({
  alternates: { canonical: routes().index() },
  description:
    'Explorez l&apos;univers Petit Roudoudou et créez des articles de puériculture Made in France, uniques, 100% personnalisables pour votre enfant. Choisissez parmi notre large gamme de tissu pour rendre votre création unique.',
});

export default async function Page() {
  return (
    <div className="bg-light-100">
      <div className="grid grid-cols-1">
        <h1 className="row-start-6 font-serif text-4xl px-4 text-center text-pretty mt-4 mb-12">
          Crée l&apos;univers de ton enfant en quelques clics !
        </h1>
        <div className="row-start-1">
          <InfoBannerFromCms />
        </div>
        <div className="row-start-2">
          <News />
        </div>
        <div className="row-start-3 mx-auto mt-8 w-full lg:max-w-[72rem]">
          <ArticleCarousels />
        </div>
        <div className="row-start-4 mx-auto mt-8 w-full lg:max-w-[72rem]">
          <CategoriesCarousel />
          <Link href={routes().shop().index()} className="btn-primary mx-auto">
            Voir la boutique
          </Link>
        </div>
        <div className="row-start-7">
          <LinksFromCMS />
        </div>
        <div className="row-start-5">
          <HomeInfos />
        </div>
      </div>
      <div className="bg-white mb-16 pt-16">
        <NewsletterSection />
      </div>
    </div>
  );
}
