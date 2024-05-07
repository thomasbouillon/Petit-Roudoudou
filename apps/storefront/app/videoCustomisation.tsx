import Link from 'next/link';
import { routes } from '@couture-next/routing';
import { trpc } from 'apps/storefront/trpc-server';

export async function VideoCustomisation() {
  return (
    <div>
      <h2 className="font-serif text-3xl">Créez l’univers de votre enfant en quelques clics !</h2>
      <Link href={routes().shop().index({ customizableOnly: true })} className="btn-secodnary bg-white"></Link>
    </div>
  );
}
