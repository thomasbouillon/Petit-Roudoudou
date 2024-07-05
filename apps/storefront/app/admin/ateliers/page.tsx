import Link from 'next/link';
import List from './List';
import { routes } from '@couture-next/routing';

export default function Page() {
  return (
    <>
      <h1 className="text-3xl font-serif text-center mb-8">Ateliers</h1>
      <ul className="border rounded-md shadow-md mx-auto max-w-md w-full">
        <List />
        <li>
          <Link href={routes().admin().workshopSessions().new()} className="btn-light text-center w-full">
            Ajouter
          </Link>
        </li>
      </ul>
    </>
  );
}
