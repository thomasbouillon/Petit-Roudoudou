import News from './news';
import { generateMetadata } from '@couture-next/utils';
import { HomeInfos } from './homeInfos';
import { NewsletterSection } from './newsLetterSection';
import { CategoriesCarousel } from './CategoriesCarousel';
import { routes } from '@couture-next/routing';
import { VideoCustomisation } from './videoCustomisation';
import { ArticleCarousels } from './articleCarousels';
import Link from 'next/link';
import { WithDecorativeDotsWrapper } from '@couture-next/ui/WithDecorativeDotsWrapper';

export const metadata = generateMetadata({
  alternates: { canonical: routes().index() },
  description:
    'Explorez l&apos;univers Petit Roudoudou et créez des articles de puériculture Made in France, uniques, 100% personnalisables pour votre enfant. Choisissez parmi notre large gamme de tissu pour rendre votre création unique.',
});

export default async function Page() {
  return (
    <div className="">
      <WithDecorativeDotsWrapper dotsPosition={'bottom-left'} />
      <div className="flex flex-col-reverse">
        <h1 className="font-serif text-4xl px-4 text-center text-pretty my-8">
          Crée l&apos;univers de ton enfant en quelques clics !
        </h1>
        <div>
          <News />
        </div>
      </div>
      <div className="pt-">
        <VideoCustomisation />
      </div>
      <div className="bg-light-100 pt-6">
        <div className="sm:m-auto mt-8 max-w-[74.25rem] empty:hidden sm:px-4">
          <ArticleCarousels />
        </div>
        <div className="sm:m-auto mt-8 px-4 max-w-[74.25rem] empty:hidden">
          <CategoriesCarousel />
          <Link href={routes().shop().index()} className="btn-primary mt-4 mx-auto">
            Voir la boutique
          </Link>
        </div>
        <div className="relative">
          <HomeInfos />
        </div>
      </div>
      <div className="bg-white mb-16 pt-16">
        <NewsletterSection />
      </div>
    </div>
  );
}
