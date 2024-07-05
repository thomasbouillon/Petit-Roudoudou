'use client';

import { routes } from '@couture-next/routing';
import { Spinner } from '@couture-next/ui/Spinner';
import { EyeIcon } from '@heroicons/react/24/solid';
import { trpc } from 'apps/storefront/trpc-client';
import Link from 'next/link';

export default function List() {
  const query = trpc.workshopSessions.list.useQuery();

  if (query.error) {
    return <div>Error: {query.error.message}</div>;
  }

  if (query.isPending) {
    return (
      <li className="px-8 py-4 block border-b">
        <Spinner />
      </li>
    );
  }

  if (query.data?.length === 0) return <li className="px-8 py-4 block border-b">Aucun atelier</li>;

  return query.data?.map((session) => (
    <li key={session.id} className="border-b flex">
      <Link
        className="px-8 py-4 block grow"
        href={routes().admin().workshopSessions().workshopSession(session.id).edit()}
      >
        {session.title} (
        {session.startDate.toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
        )<small className="block">{session.attendeeIds.length} participant(s)</small>
      </Link>
      <Link
        className="basis-12 flex items-center text-primary-100 border-l justify-center"
        href={routes().admin().workshopSessions().workshopSession(session.id).attendees()}
      >
        <EyeIcon className="h-6 w-6" />
      </Link>
    </li>
  ));
}
