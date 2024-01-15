import { routes } from '@couture-next/routing';
import { Article, ArticleMetadata } from '@couture-next/types';
import { firestoreConverterAddRemoveId } from '@couture-next/utils';
import useDatabase from 'apps/storefront/hooks/useDatabase';
import { collection, getDocs } from 'firebase/firestore';
import { MetadataRoute } from 'next';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const db = useDatabase();
  const [allArticlesMetadata, allArticles] = await Promise.all([
    getDocs(collection(db, 'articles-metadata')).then((snapshot) =>
      snapshot.docs
        .map((snapshot) => ({ ...(snapshot.data() as ArticleMetadata), _id: snapshot.id }))
        .reduce((acc, curr) => ({ ...acc, [curr._id]: curr }), {} as Record<string, ArticleMetadata>)
    ),
    getDocs(collection(db, 'articles').withConverter(firestoreConverterAddRemoveId<Article>())).then((snapshot) =>
      snapshot.docs.map((snapshot) => snapshot.data())
    ),
  ]);

  const allArticlesWithMetadata = allArticles.map((article) => ({
    ...article,
    updatedAt: new Date(allArticlesMetadata[article._id].updatedAt),
  }));

  return allArticlesWithMetadata.flatMap(
    (article) =>
      [
        { url: routes().shop().article(article.slug).index(), lastModified: article.updatedAt, priority: 0.9 },
        { url: routes().shop().customize(article.slug), lastModified: article.updatedAt },
        ...article.stocks.map((stock) => ({
          url: routes().shop().article(article.slug).showInStock(stock.slug),
          lastModified: article.updatedAt,
          priority: 0.9,
        })),
      ] satisfies MetadataRoute.Sitemap
  );
}
