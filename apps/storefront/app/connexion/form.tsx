'use client';

import { Field } from '@couture-next/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
// import { useCallback } from 'react';
// import GoogleIcon from '../../assets/google.svg';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { routes } from '@couture-next/routing';

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

  // const handleSignInWithGoogle = useCallback(() => {
  //   loginWithEmailPassMutation
  //     .mutateAsync({ type: 'google' })
  //     .then(() => {
  //       reset();
  //       router.push(redirectTo);
  //     })
  //     .catch((error: any) => {
  //       console.error(error.code, error.message);
  //       setError('root', { message: errorFromCode(error.code) });
  //     });
  // }, [loginMutation, router, reset, setError, errorFromCode, searchParams]);

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
      {/* <button type="button" className="btn mt-4 w-full" onClick={handleSignInWithGoogle}>
        <GoogleIcon className="inline-block w-6 h-6 mr-2" />
        Me connecter avec Google
      </button> */}
      <p className="mt-6">
        Pas encore de compte ?{' '}
        <Link href={routes().auth().register(redirectTo)} className="text-primary underline">
          Créer un compte
        </Link>
      </p>
    </form>
  );
}
