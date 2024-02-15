'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-sm mx-auto min-h-[100svh] flex items-center">
      <div className="space-y-4">
        <h1 className="font-serif text-4xl text-center mb-8">Aie... Une erreur est survenue</h1>
        <p>Une erreur est survenue, nous nous excusons de la gêne occasionnée.</p>
        <p>Vous pouvez recharger la partie de la page qui a généré l'erreur:</p>
        <button type="button" className="btn-primary mx-auto" onClick={reset}>
          Réessayer
        </button>
        <p>Sinon vous pouvez essayer de recharger la page</p>
        <button type="button" className="btn-secondary mx-auto" onClick={() => window.location.reload()}>
          Rafraichir
        </button>
      </div>
    </div>
  );
}
