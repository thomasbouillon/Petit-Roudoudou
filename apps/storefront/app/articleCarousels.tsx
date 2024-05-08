import { trpc } from 'apps/storefront/trpc-server';
import { ArticleCarousel } from './articleCarousel';
import { Article } from '@couture-next/types';

const desiredSlugs = ['couverture-2-tissus', 'protege-carnet-de-sante'];

export async function ArticleCarousels() {
  const allArticles = await trpc.articles.list.query();
  const articles = allArticles.filter((article) => desiredSlugs.includes(article.slug));
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
