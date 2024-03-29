'use client';

import { Field } from '@couture-next/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useCallback } from 'react';
import GoogleIcon from '../../assets/google.svg';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { routes } from '@couture-next/routing';

const schema = z.object({
  firstName: z.string().min(1, "Le prénom n'est pas valide."),
  email: z.string().email('Email invalide'),
  password: z.string(),
});

type SchemaType = z.infer<typeof schema>;

export default function CreateAccountForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
  } = useForm<SchemaType>({
    resolver: zodResolver(schema),
  });

  const searchParams = useSearchParams();
  const redirectTo = decodeURIComponent(searchParams.get('redirectTo') ?? '') || '/';

  const { loginMutation, errorFromCode } = useAuth();
  const router = useRouter();

  const onSubmit = handleSubmit((data) => {
    loginMutation
      .mutateAsync({
        type: 'email-register',
        email: data.email,
        password: data.password,
        firstName: data.firstName,
      })
      .then(() => {
        reset();
        router.push(redirectTo);
      })
      .catch((error: any) => {
        console.error(error.code, error.message);
        setError('root', { message: errorFromCode(error.code) });
      });
  });

  const handleSignUpWithGoogle = useCallback(() => {
    loginMutation
      .mutateAsync({ type: 'google' })
      .then(() => {
        reset();
        router.push(redirectTo);
      })
      .catch((error: any) => {
        console.error(error.code, error.message);
        setError('root', { message: errorFromCode(error.code) });
      });
  }, [loginMutation, router, reset, setError, errorFromCode, searchParams]);

  return (
    <form onSubmit={onSubmit} className="sm:border rounded-md px-4 py-6 mb-24 mt-8 md:mt-24">
      <h1 className="font-serif text-3xl text-center">Inscription</h1>
      <div className="text-red-500 min-h-[2rem] text-center my-2">{errors.root?.message}</div>
      <div className="flex flex-col gap-2 mb-6">
        <Field
          label="Prénom"
          widgetId="firstName"
          labelClassName="!items-start"
          error={errors.firstName?.message}
          renderWidget={(className) => <input {...register('firstName')} className={className} required />}
        />
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
          labelClassName="!items-start"
          error={errors.password?.message}
          renderWidget={(className) => (
            <input {...register('password')} className={className} required type="password" />
          )}
        />
      </div>
      <small className="block mb-4">
        Nous utilisons Brevo pour nos envois d'email, en créant un compte, votre email et prénom seront également
        transmis à{' '}
        <a href="https://www.brevo.com/fr/legal/privacypolicy/" className="underline">
          Brevo
        </a>
        .
      </small>
      <button type="submit" className="btn-primary w-full">
        Créer mon compte
      </button>
      <button type="button" className="btn mt-4 w-full" onClick={handleSignUpWithGoogle}>
        <GoogleIcon className="inline-block w-6 h-6 mr-2" />
        Créer mon compte avec Google
      </button>
      <p className="mt-6">
        Déjà un compte ?{' '}
        <Link href={routes().auth().login(redirectTo)} className="text-primary underline">
          Se connecter
        </Link>
      </p>
    </form>
  );
}
