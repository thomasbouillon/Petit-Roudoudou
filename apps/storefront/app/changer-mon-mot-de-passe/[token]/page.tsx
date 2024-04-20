import { generateMetadata } from '@couture-next/utils';
import { ChangePasswordForm } from './ChangePasswordForm';

export const metadata = generateMetadata({
  title: 'Cahangement de mot de passe',
  robots: 'noindex, nofollow',
});

type Props = {
  params: {
    token: string;
  };
};

export default function Page({ params }: Props) {
  return (
    <div className="max-w-md mx-auto border rounded-sm p-4 mt-16">
      <h1 className="text-3xl font-serif text-center mb-6">Changement de mot de passe</h1>
      <p className="mb-2">Porte d'entrée vers l'univer de ton petit bout</p>
      <ChangePasswordForm token={params.token} />
    </div>
  );
}
