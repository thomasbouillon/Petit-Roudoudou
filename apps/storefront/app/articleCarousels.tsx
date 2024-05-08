import { getCmsClient } from '@couture-next/cms';
import { ArticleCarousel } from './articleCarousel';
import { Article } from '@couture-next/types';
import { trpc } from '../trpc-server';
import env from '../env';

export async function ArticleCarousels() {
  const cmsClient = getCmsClient(env.DIRECTUS_BASE_URL);
  const articleIdsToShow = await cmsClient.getHome().then((res) => res.articleIdsShowcase);

  const articles = await Promise.all(articleIdsToShow.map(({ articleId }) => trpc.articles.findById.query(articleId)));

  return (
    <>
      <div className="space-y-8">
        {articles.map((article) => (
          <ArticleCarousel article={article as Article} key={article.id} />
        ))}
      </div>
    </>
  );
}
