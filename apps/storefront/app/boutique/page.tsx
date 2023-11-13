import { Article } from '@couture-next/types';
import Card from './card';
import { collection, getDocs } from 'firebase/firestore';
import useDatabase from '../../hooks/useDatabase';
import {
  firestoreConverterAddRemoveId,
  generateMetadata,
} from '@couture-next/utils';
import { routes } from '@couture-next/routing';

const getMinimumPriceFromSkus = (skus: Article['skus']) =>
  Math.min(...skus.map((sku) => sku.price));

export const metadata = generateMetadata({
  title: 'Boutique',
  description:
    'Venez découvrir tous les créations made in France 100% personnalisables ! Couvertures, Gigoteuses, Doudous, Bavoirs, tout est cousu à la main avec passion !',
});

export const dynamic = 'force-dynamic';

export default async function Page() {
  const db = useDatabase();
  const articles = await getDocs(
    collection(db, 'articles').withConverter(
      firestoreConverterAddRemoveId<Article>()
    )
  ).then((snapshot) => snapshot.docs.map((doc) => doc.data()));

  if (articles.length === 0)
    return <p className="mt-8 text-center">Aucun article pour le moment</p>;

  return (
    <>
      <h1 className="text-3xl font-serif text-center mt-8">Boutique</h1>
      <div className="bg-light-100 relative my-8">
        <div className="absolute w-full z-10">
          <div className="w-full h-[10vh] bg-white"></div>
          <div className="w-full triangle-bottom bg-white"></div>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,min(24rem,100%))] place-content-center gap-8 pt-2 px-4 relative z-10">
          {articles.map((article) => (
            <>
              <Card
                title={article.name}
                description={article.description}
                image={article.images[0].url}
                placeholderDataUrl={article.images[0].placeholderDataUrl}
                price={getMinimumPriceFromSkus(article.skus)}
                key={article._id}
                buttonLabel="Personnaliser"
                buttonLink={routes().shop().customize(article.slug)}
                variant="customizable-article"
              />
              {article.stocks.map((stock, i) => (
                <Card
                  title={stock.title}
                  description={stock.description}
                  image={stock.images[0].url}
                  placeholderDataUrl={stock.images[0].placeholderDataUrl}
                  price={
                    article.skus.find((sku) => sku.uid === stock.sku)?.price ??
                    0
                  }
                  key={stock.sku + i}
                  buttonLabel="Découvrir"
                  buttonLink={routes().shop().show(i, article.slug)}
                  variant="default"
                />
              ))}
            </>
          ))}
        </div>
        <div className="absolute bottom-0 w-full">
          <div className="bg-white h-[20vh] w-full">
            <div className="triangle-bottom bg-light-100 w-full"></div>
          </div>
        </div>
      </div>
    </>
  );
}
