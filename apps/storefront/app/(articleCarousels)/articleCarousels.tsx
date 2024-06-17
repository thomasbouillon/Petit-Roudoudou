import { getCmsClient } from '@couture-next/cms';
import { ArticleCarousel } from './articleCarousel';
import { Article } from '@couture-next/types';
import { trpc } from '../../trpc-server';
import env from '../../env';

export async function ArticleCarousels() {
  const cmsClient = getCmsClient(env.DIRECTUS_BASE_URL);
  const articleIdsToShow = await cmsClient.getHome().then((res) => res.articleIdsShowcase);

  const articles = await Promise.all(articleIdsToShow.map(({ articleId }) => trpc.articles.findById.query(articleId)));

  return (
    <>
      <div className="space-y-8">
        <h2 className="sr-only">
          Couvertures, Gigoteuses, Doudous ou encore Protège carnet de santé, découvres nos articles phares.
        </h2>
        {articles.map((article) => (
          <ArticleCarousel article={article as Article} key={article.id} shouldPrioritizeFirstImage />
        ))}
      </div>
    </>
  );
}
