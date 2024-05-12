import { routes } from '@couture-next/routing';
import { Article } from '@couture-next/types';
import { trpc } from 'apps/storefront/trpc-server';
import { MetadataRoute } from 'next';
import env from '../../env';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = (await trpc.articles.list.query()) as Article[];

  const latestUpdatedAt = articles.reduce(
    (acc, curr) => (acc ? (curr.updatedAt > acc ? curr.updatedAt : acc) : curr.updatedAt),
    undefined as Date | undefined
  );

  return articles
    .flatMap(
      (article) =>
        [
          {
            url: env.BASE_URL + routes().shop().article(article.slug).index(),
            lastModified: article.updatedAt,
            priority: 0.9,
          },
          { url: env.BASE_URL + routes().shop().customize(article.slug), lastModified: article.updatedAt },
          ...article.stocks.map((stock) => ({
            url: env.BASE_URL + routes().shop().article(article.slug).showInStock(stock.slug),
            lastModified: article.updatedAt,
            priority: 0.9,
          })),
        ] satisfies MetadataRoute.Sitemap
    )
    .concat(
      ...([
        {
          url: env.BASE_URL + routes().shop().index(),
          lastModified: latestUpdatedAt!,
          priority: 0.8,
        },
        {
          url: env.BASE_URL + routes().shop().listCustomizableArticles(),
          lastModified: latestUpdatedAt!,
          priority: 0.8,
        },
        {
          url: env.BASE_URL + routes().shop().createGiftCard(),
          lastModified: latestUpdatedAt!,
          priority: 0.6,
        },
      ] satisfies MetadataRoute.Sitemap)
    );
}
