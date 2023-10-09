'use client';

import { useQuery } from '@tanstack/react-query';
import useDatabase from '../../../hooks/useDatabase';
import { collection, getDocs } from 'firebase/firestore';
import { Article } from '@couture-next/types';

export default function Page() {
  const database = useDatabase();

  const { data: articles, error } = useQuery(['articles'], () =>
    getDocs(collection(database, 'articles')).then((snapshot) =>
      snapshot.docs.map(
        (doc) =>
          ({
            ...doc.data(),
            _id: doc.id,
          } as Article)
      )
    )
  );
  if (error) throw error;
  if (articles === undefined) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-3xl font-serif text-center mb-8">Créations</h1>
      <ul className="border rounded-md shadow-md mx-auto max-w-md w-full">
        {articles.map((article) => (
          <li key={article._id} className="border-b py-4">
            <a
              className="px-8"
              href={`/admin/creations/${article._id}/modifier`}
            >
              {article.name}
            </a>
          </li>
        ))}
        <li>
          <a
            href="/admin/creations/nouveau"
            className="btn-light text-center w-full"
          >
            Ajouter
          </a>
        </li>
      </ul>
    </div>
  );
}
