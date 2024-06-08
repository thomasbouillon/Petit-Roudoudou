import Link from 'next/link';
import List from './List';
import { routes } from '@couture-next/routing';

export default function Page() {
  return (
    <div className="">
      <h1 className="text-3xl font-serif text-center mb-8">Liens de tracables</h1>
      <div className="border rounded-md shadow-md mx-auto max-w-md w-full">
        <List />
        <Link className="btn-light mx-auto" href={routes().admin().trackingLinks().new()}>
          Créer un lien de tracking
        </Link>
      </div>
    </div>
  );
}
