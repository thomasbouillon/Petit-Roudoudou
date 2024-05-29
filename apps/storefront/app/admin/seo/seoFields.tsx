'use client';

import Link from 'next/link';
import { routes } from '@couture-next/routing';
import { trpc } from 'apps/storefront/trpc-client';
import Image from 'next/image';
import { loader } from '../../../utils/next-image-firebase-storage-loader';

export function Form() {
  const { data: articles, error } = trpc.articles.list.useQuery();
  if (error) throw error;
  if (articles === undefined) return <div>Loading...</div>;
  const SubmitButton = <button type="submit"></button>;

  return (
    <form className="max-w-3xl mx-auto mt-8 shadow-sm bg-white rounded-md px-4 border">
      <div>
        <h2 className="text-2xl p-4 py-6 font-bold">Catégories</h2>
        <ul className="w-11/12 mx-auto grid grid-cols-4 gap-4 text-center">
          {articles.map((article) => (
            <li key={article.id}>
              <Image
                src={article.images[0].url}
                alt={article.namePlural}
                className="w-full aspect-square object-cover"
                loader={loader}
                width={544 / 2}
                height={544 / 2}
              />
              <span className="">{article.name}</span>
            </li>
          ))}
        </ul>
        <div></div>
      </div>
      <div>
        <h3 className="text-xl  p-4 py-6 font-bold">Stock</h3>
        <div></div>
        <div></div>
      </div>
      <div>
        <h3 className="text-xl p-4 py-6  font-bold">Personnaliser</h3>
        <div></div>
      </div>
      <div className="flex justify-end border-t px-4 py-4 mt-6">{SubmitButton}</div>
    </form>
  );
}
