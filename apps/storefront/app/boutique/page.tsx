'use client';

import { Article } from '@couture-next/types';
import Card from './card';
import { useQuery } from '@tanstack/react-query';
import { collection, getDocs } from 'firebase/firestore';
import useDatabase from '../../hooks/useDatabase';
import converter from '../../utils/firebase-add-remove-id-converter';

const getMinimumPriceFromSkus = (skus: Article['skus']) =>
  Math.min(...skus.map((sku) => sku.price));

export default function Page() {
  const db = useDatabase();
  const { data: articles, error } = useQuery<Article[]>(
    ['articles'],
    async () =>
      getDocs(
        collection(db, 'articles').withConverter(converter<Article>())
      ).then((snapshot) => snapshot.docs.map((doc) => doc.data()))
  );
  if (error) throw error;

  if (articles === undefined) return null;
  if (articles.length === 0)
    return <p className="mt-8 text-center">Aucun article pour le moment</p>;

  return (
    <div className="bg-light-100 relative my-8">
      <div className="absolute w-full">
        <div className="w-full h-[20vh] bg-white"></div>
        <div className="w-full triangle-bottom bg-white"></div>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(24rem,1fr))] place-content-center gap-8 pt-2 px-4 relative z-10">
        {articles.map((article) => (
          <Card
            title={article.name}
            description={article.description}
            image={article.images[0].url}
            price={getMinimumPriceFromSkus(article.skus)}
            key={article._id}
            buttonLabel="Personnaliser"
            buttonLink={`/personnaliser/${article.slug}`}
            variant="customizable-article"
          />
        ))}
      </div>
      <div className="absolute bottom-0 w-full">
        <div className="bg-white h-[20vh] w-full">
          <div className="triangle-bottom bg-light-100 w-full"></div>
        </div>
      </div>
    </div>
  );
}
