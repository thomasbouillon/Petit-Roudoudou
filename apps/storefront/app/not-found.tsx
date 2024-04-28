import { routes } from '@couture-next/routing';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mt-16 max-w-sm mx-auto">
      <div className="space-y-4">
        <p className="font-serif text-6xl text-center mb-8">Aie...</p>
        <h1 className="">La page que tu recherches n'existe pas ou a été déplacée</h1>
        <p>
          Comme tu avais pu le remarquer, le site s'est fait peau neuve, il est donc possible que tu sois arrivé ici à
          cause d'un lien vers l'ancien site.
        </p>
        <p>(Mais soyons honnêtes c'est surement de notre faute 🫣)</p>
      </div>
      <Link href={routes().index()} className="btn-primary mx-auto mt-8">
        Retour au site
      </Link>
    </div>
  );
}
