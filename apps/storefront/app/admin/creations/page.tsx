'use client';

import { useQuery } from '@tanstack/react-query';
import useDatabase from '../../../hooks/useDatabase';
import { collection, getDocs } from 'firebase/firestore';
import { Article } from '@couture-next/types';
import Link from 'next/link';
import converter from '../../../utils/firebase-add-remove-id-converter';
import { routes } from '@couture-next/routing';

export default function Page() {
  const database = useDatabase();

  const { data: articles, error } = useQuery(['articles.all'], () =>
    getDocs(
      collection(database, 'articles').withConverter(converter<Article>())
    ).then((snapshot) => snapshot.docs.map((doc) => doc.data()))
  );
  if (error) throw error;
  if (articles === undefined) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-3xl font-serif text-center mb-8">Créations</h1>
      <ul className="border rounded-md shadow-md mx-auto max-w-md w-full">
        {articles.map((article) => (
          <li key={article._id} className="border-b py-4">
            <Link
              className="px-8 block"
              href={routes().admin().products().product(article._id).edit()}
            >
              {article.name}
            </Link>
          </li>
        ))}
        <li>
          <Link
            href={routes().admin().products().new()}
            className="btn-light text-center w-full"
          >
            Ajouter
          </Link>
        </li>
      </ul>
    </div>
  );
}
