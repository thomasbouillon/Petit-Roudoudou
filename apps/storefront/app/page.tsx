import News from './news';
import { generateMetadata } from '@couture-next/utils';
import { LinksFromCMS } from './linksFromCMS';
import { HomeInfos } from './homeInfos';
import { Inspirations } from './inspirations';
import { NewsletterSection } from './newsLetterSection';
import InfoBannerFromCms from './InfoBannerFromCms';
import { ArticleCarousel } from './articleCarousel';
import { SlugCarousel } from './slugCarousel';
import { routes } from '@couture-next/routing';
import { VideoCustomisation } from './videoCustomisation';

export const metadata = generateMetadata({
  alternates: { canonical: routes().index() },
  description:
    'Explorez l&apos;univers Petit Roudoudou et créez des articles de puériculture Made in France, uniques, 100% personnalisables pour votre enfant. Choisissez parmi notre large gamme de tissu pour rendre votre création unique.',
});

export default async function Page() {
  return (
    <div className="bg-light-100">
      <div className="grid grid-cols-1">
        <h1 className="row-start-7 font-serif text-4xl px-4 text-center text-pretty translate-y-12">
          Crée l&apos;univers de ton enfant en quelques clics !
        </h1>
        <div className="row-start-1">
          <InfoBannerFromCms />
        </div>
        <div className="row-start-2">
          <News />
        </div>
        <div className="row-start-3">
          <VideoCustomisation />
        </div>
        <div className="row-start-4 sm:m-auto mt-8 px-4 max-w-[74.25rem] empty:hidden">
          <ArticleCarousel />
        </div>
        <div className="row-start-5 sm:m-auto mt-8 px-4 max-w-[74.25rem] empty:hidden">
          <SlugCarousel />
        </div>
        <div className="row-start-8">
          <LinksFromCMS />
        </div>
        <div className="row-start-6">
          <HomeInfos />
        </div>
      </div>
      <Inspirations />
      <div className="bg-white mb-16">
        <NewsletterSection />
      </div>
    </div>
  );
}
