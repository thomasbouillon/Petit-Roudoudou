import { generateMetadata } from '@couture-next/utils';
import { ForgotPasswordForm } from './ForgotPasswordForm';

export const metadata = generateMetadata({
  title: 'Mot de passe oublié',
  alternates: { canonical: '/mot-de-passe-oublie' },
  description:
    'Vous avez oublié votre mot de passe ? Pas de panique, remplissez le formulaire pour recevoir un lien de réinitialisation.',
});

export default function Page() {
  return (
    <div className="max-w-md mx-auto border rounded-sm p-4 mt-16">
      <h1 className="text-3xl font-serif text-center mb-6">Mot de passe oublié</h1>
      <p className="mb-2">
        Remplissez le formulaire pour recevoir un lien qui vous permettras de modifier votre mot de passe.
      </p>
      <ForgotPasswordForm />
    </div>
  );
}
