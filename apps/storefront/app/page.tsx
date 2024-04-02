import News from './news';
import { generateMetadata } from '@couture-next/utils';
import { LinksFromCMS } from './linksFromCMS';
import { HomeInfos } from './homeInfos';
import { ArticleShowcase } from './articleShowcase';
import { Inspirations } from './inspirations';
import { NewsletterSection } from './newsLetterSection';
import InfoBannerFromCms from './InfoBannerFromCms';

export const metadata = generateMetadata({
  description:
    'Explorez l&apos;univers Petit Roudoudou et créez des articles de puériculture Made in France, uniques, 100% personnalisables pour votre enfant. Choisissez parmi notre large gamme de tissu pour rendre votre création unique.',
});

export default async function Page() {
  return (
    <div className="bg-light-100">
      <InfoBannerFromCms />
      <div className="flex flex-col-reverse pb-4">
        <h1 className="font-serif text-4xl px-4 text-center text-pretty translate-y-12">
          Créez l&apos;univers de votre enfant en quelques clics !
        </h1>
        <News />
      </div>
      <LinksFromCMS />
      <div className="mt-20">
        <HomeInfos />
      </div>
      <div className="mt-8 px-4 pb-12 empty:hidden">
        <ArticleShowcase />
      </div>
      <Inspirations />
      <div className="bg-white mb-16">
        <NewsletterSection />
      </div>
    </div>
  );
}
