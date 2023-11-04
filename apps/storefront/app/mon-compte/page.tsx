import { routes } from '@couture-next/routing';
import Link from 'next/link';

export default function Page() {
  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-serif text-center">Mon compte</h1>
      <Link href={routes().account().orders().index()} className="btn-light">
        Mes commandes
      </Link>
    </div>
  );
}
