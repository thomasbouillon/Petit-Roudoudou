'use client';

import Link from 'next/link';
import { routes } from '@couture-next/routing';
import { trpc } from 'apps/storefront/trpc-client';

export default function Page() {
  const { data: articles, error } = trpc.articles.list.useQuery();
  if (error) throw error;
  if (articles === undefined) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-3xl font-serif text-center mb-8">Créations</h1>
      <ul className="border rounded-md shadow-md mx-auto max-w-md w-full">
        {articles.map((article) => (
          <li key={article.id} className="border-b">
            <Link className="px-8 py-4 block" href={routes().admin().products().product(article.id).edit()}>
              {article.name}
            </Link>
          </li>
        ))}
        <li>
          <Link href={routes().admin().products().new()} className="btn-light text-center w-full">
            Ajouter
          </Link>
        </li>
      </ul>
    </div>
  );
}
