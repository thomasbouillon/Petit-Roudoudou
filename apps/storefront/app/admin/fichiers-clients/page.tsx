'use client';

import { routes } from '@couture-next/routing';
import { Spinner } from '@couture-next/ui/Spinner';
import { useDebounce } from 'apps/storefront/hooks/useDebounce';
import { trpc } from 'apps/storefront/trpc-client';
import Link from 'next/link';
import { useState } from 'react';

export default function Page() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const query = trpc.users.search.useQuery(debouncedSearch);

  if (query.isError) throw query.error;

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-center text-3xl font-serif mb-6">Fichiers clients</h1>
      <div className="mx-auto mb-4">
        <div className="flex justify-between">
          <p>Rechercher un client</p>
          <p>{query.data?.count} résultat(s)</p>
        </div>
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="email ou prénom ou nom"
            className="border rounded-sm px-2 py-1 w-full"
          />
          {(query.isPending || search !== debouncedSearch) && (
            <Spinner className="absolute right-2 top-0 h-full aspect-square" />
          )}
        </div>
      </div>
      <ul>
        {query.data?.users.map((user) => (
          <li key={user.id} className="odd:bg-gray-100">
            <Link
              className="py-1 px-2 grid grid-cols-[auto_auto_1fr] gap-2"
              href={routes().admin().users().user(user.id).show()}
            >
              <span>{user.firstName}</span>
              <span>{user.lastName}</span>
              <span className="break-all text-right">{user.email}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
