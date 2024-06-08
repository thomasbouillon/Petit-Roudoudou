'use client';

import { routes } from '@couture-next/routing';
import { trpc } from 'apps/storefront/trpc-client';
import Link from 'next/link';

export default function List() {
  const trackingLinksQuery = trpc.trackingLinks.list.useQuery();

  return (
    <ul>
      {trackingLinksQuery.data?.map((trackingLink) => (
        <li key={trackingLink.id} className="border-b">
          <Link className="block p-4" href={routes().admin().trackingLinks().trackingLink(trackingLink.id).edit()}>
            {trackingLink.name}
          </Link>
        </li>
      ))}
      {trackingLinksQuery.data?.length === 0 && (
        <li className="border-b py-4 text-center">Rien à afficher pour le moment</li>
      )}
    </ul>
  );
}
