'use client';

import { routes } from '@couture-next/routing';
import { trpc } from 'apps/storefront/trpc-client';
import Link from 'next/link';

export default function Page() {
  const articleThemesQuery = trpc.articleThemes.list.useQuery();

  return (
    <>
      <h1 className="text-3xl font-serif text-center mb-8">Thèmes</h1>
      <ul className="border rounded-md shadow-md mx-auto max-w-md w-full">
        {articleThemesQuery.data?.map((group) => (
          <li className="border-b" key={group.id}>
            <Link className="px-8 py-4 block" href={routes().admin().articleThemes().articleTheme(group.id).edit()}>
              {group.name}
            </Link>
          </li>
        ))}
        {articleThemesQuery.data?.length === 0 && (
          <li className="border-b py-4 text-center">Rien à afficher pour le moment</li>
        )}
      </ul>
    </>
  );
}
