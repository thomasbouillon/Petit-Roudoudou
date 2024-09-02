'use client';

import { Field } from '@couture-next/ui/form/Field';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useCallback } from 'react';
import GoogleIcon from '../../assets/google.svg';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { routes } from '@couture-next/routing';
import { trpc } from 'apps/storefront/trpc-client';
import { Spinner } from '@couture-next/ui/Spinner';
import clsx from 'clsx';

const schema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string(),
});

type SchemaType = z.infer<typeof schema>;

export default function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    setError,
  } = useForm<SchemaType>({
    resolver: zodResolver(schema),
  });

  const searchParams = useSearchParams();
  const redirectTo = decodeURIComponent(searchParams.get('redirectTo') ?? '') || '/';

  const { loginWithEmailPassMutation } = useAuth();
  const router = useRouter();

  const onSubmit = handleSubmit((data) => {
    loginWithEmailPassMutation
      .mutateAsync({
        email: data.email,
        password: data.password,
      })
      .then(() => {
        reset();
        router.push(redirectTo);
      })
      .catch((error) => {
        setError('root', { message: ('shape' in error && error.shape?.message) || 'Une erreur est survenue' });
      });
  });

  return (
    <form onSubmit={onSubmit} className="sm:border rounded-md px-4 py-6 mb-24 mt-8 md:mt-24">
      <h1 className="font-serif text-3xl text-center">Connexion</h1>

      <div className="text-red-500 min-h-[2rem] text-center my-2">{errors.root?.message}</div>
      {errors.root && (
        <>
          <p>Première connexion sur cette novelle version du site ?</p>
          <p>
            Si tu n'arrives pas à te connecter, réinitialise votre mot de passe à l'aide du bouton mot de passe oublié.
          </p>
        </>
      )}
      <div className="flex flex-col gap-2 mb-6">
        <Field
          label="Email"
          widgetId="email"
          error={errors.email?.message}
          labelClassName="!items-start"
          renderWidget={(className) => <input {...register('email')} className={className} />}
        />
        <Field
          label="Mot de passe"
          widgetId="password"
          labelClassName="!items-start inline-block"
          error={errors.password?.message}
          renderWidget={(className) => (
            <div className="relative">
              <input {...register('password')} className={className} required type="password" />
              <Link
                href={routes().auth().resetPassword(watch('email'))}
                className="absolute bottom-full right-0 -translate-y-2 underline"
              >
                Mot de passe oublié ?
              </Link>
            </div>
          )}
        />
      </div>
      <button type="submit" className="btn-primary w-full">
        Me connecter
      </button>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-4">
        <div className="bg-gray-200 h-1 scale-y-50"></div>
        <p className="my-4">Ou</p>
        <div className="bg-gray-200 h-1 scale-y-50"></div>
      </div>
      <SignInWithGoogle />
      <p className="mt-6">
        Pas encore de compte ?{' '}
        <Link href={routes().auth().register(redirectTo)} className="text-primary underline">
          Créer un compte
        </Link>
      </p>
    </form>
  );
}

export const SignInWithGoogle = () => {
  const getGoogleUrlQuery = trpc.auth.googleOauth.getAuthorizationUrl.useQuery();

  if (getGoogleUrlQuery.isError) {
    return (
      <div className="btn border w-full text-center">
        <GoogleIcon className="inline-block w-6 h-6 mr-2" />
        Impossible de se connecter avec Google pour le moment
      </div>
    );
  }

  if (getGoogleUrlQuery.isPending) {
    return (
      <div className="btn border w-full text-center">
        <GoogleIcon className="inline-block w-6 h-6 mr-2" />
        <div className="inline-block relative">
          <span aria-hidden className="text-transparent">
            Continuer avec Google
          </span>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Spinner />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link href={getGoogleUrlQuery.data.url} className="btn border w-full text-center">
      <GoogleIcon className="inline-block w-6 h-6 mr-2" />
      Continuer avec Google
    </Link>
  );
};
