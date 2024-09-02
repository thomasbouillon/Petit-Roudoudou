import { Spinner } from '@couture-next/ui/Spinner';
import AutoRedirect from './AutoRedirect';

export default function Page() {
  return (
    <div className="text-center mt-6 min-h-[80vh] flex flex-col gap-4 justify-center">
      <h1 className="text-3xl font-serif">Connexion avec Google</h1>
      <p>Redirection dans quelques instants</p>
      <Spinner className="mx-auto" />
      <AutoRedirect />
    </div>
  );
}
