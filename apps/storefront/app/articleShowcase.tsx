import { Home, fetchFromCMS } from '../directus';
import { collection, doc, getDoc } from 'firebase/firestore';
import useDatabase from '../hooks/useDatabase';
import { firestoreConverterAddRemoveId } from '@couture-next/utils';
import { Article } from '@couture-next/types';
import ArticleThumbnail from './articleThumbnail';
import { routes } from '@couture-next/routing';

export async function ArticleShowcase() {
  const db = useDatabase();

  const cmsHome = await fetchFromCMS<Home>('home', { fields: '*.*.*' });
  const toShow = cmsHome.articleShowcases.reduce((acc, conf) => {
    const [articleId, stockIndex] = conf.productUid.split('#');
    if (!acc[articleId]) acc[articleId] = [];
    acc[articleId].push(stockIndex ?? null);
    return acc;
  }, {} as Record<string, (string | null)[]>);

  const toShowArticleIds = Object.keys(toShow);

  const articles = (await Promise.all(
    toShowArticleIds.map((id) =>
      getDoc(doc(collection(db, 'articles').withConverter(firestoreConverterAddRemoveId<Article>()), id)).then(
        (snapshot) => {
          if (!snapshot.exists()) return null; //throw new Error(`Article with id ${id} does not exist`);
          return snapshot.data();
        }
      )
    )
  ).then((articles) => articles.filter((article) => article !== null))) as Article[];

  if (articles.length === 0) return null;

  return (
    <>
      <h2 className="text-4xl font-serif text-center mb-12">Vos coups de coeur du mois</h2>
      <div className="grid grid-cols-2 gap-4 max-w-xl">
        {articles.map((article, i) => (
          <ArticleComponent article={article} key={i} only={toShow[toShowArticleIds[i]]} />
        ))}
      </div>
    </>
  );
}

function ArticleComponent({ article, only }: { article: Article; only: (string | null)[] }) {
  const priceFromSku = (skuUid: string) => article.skus.find((sku) => sku.uid === skuUid)?.price;

  return (
    <>
      {only.includes(null) && (
        <ArticleThumbnail
          buttonLabel="Personnaliser"
          buttonLink={routes().shop().customize(article.slug)}
          image={article.images[0].url}
          title={article.name}
          price={Math.min(...article.skus.map((sku) => sku.price))}
          variant="customizable-article"
        />
      )}
      {article.stocks
        .filter((_, i) => only.includes('' + i))
        .map((stock) => (
          <ArticleThumbnail
            key={stock.uid}
            buttonLabel="Découvrir"
            buttonLink={routes().shop().article(article.slug).showInStock(stock.slug)}
            image={stock.images[0].url}
            title={stock.title}
            price={priceFromSku(stock.sku) ?? 0}
          />
        ))}
    </>
  );
}
