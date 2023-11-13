'use client';

import { Field } from '@couture-next/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../contexts/AuthContext';
import { Auth, GoogleAuthProvider, User, signInWithPopup } from 'firebase/auth';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { PropsWithChildren, useCallback } from 'react';
import { ReactComponent as GoogleIcon } from '../assets/google.svg';
import { useRouter } from 'next/navigation';

const schema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string(),
});

type SchemaType = z.infer<typeof schema>;

export default function UserCredentialsForm({
  submit,
  title,
  submitLabel,
  children,
}: PropsWithChildren<{
  title: string;
  submitLabel: string;
  submit: (auth: Auth, email: string, password: string) => Promise<User>;
}>) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
  } = useForm<SchemaType>({
    resolver: zodResolver(schema),
  });

  const { auth, errorFromCode } = useAuth();
  const router = useRouter();

  const onSubmit = handleSubmit((data) => {
    submit(auth, data.email, data.password)
      .then(() => {
        reset();
        router.push('/');
      })
      .catch((error) => {
        console.error(error.code, error.message);
        setError('root', { message: errorFromCode(error.code) });
      });
  });

  const signInWithGoogle = useCallback(() => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .then(() => {
        router.push('/');
      })
      .catch((error) => {
        console.error(error.code, error.message);
        setError('root', { message: errorFromCode(error.code) });
      });
  }, [auth, errorFromCode, setError, router]);

  return (
    <form
      onSubmit={onSubmit}
      className="sm:border rounded-md px-4 py-6 mb-24 mt-8 md:mt-24"
    >
      <h1 className="font-serif text-3xl text-center">{title}</h1>
      <div className="text-red-500 min-h-[2rem] text-center my-2">
        {errors.root?.message}
      </div>
      <div className="flex flex-col gap-2 mb-6">
        <Field
          label="Email"
          widgetId="email"
          error={errors.email?.message}
          labelClassName="!items-start"
          renderWidget={(className) => (
            <input {...register('email')} className={className} />
          )}
        />
        <Field
          label="Mot de passe"
          widgetId="password"
          labelClassName="!items-start mt-4"
          error={errors.password?.message}
          renderWidget={(className) => (
            <input
              {...register('password')}
              className={className}
              required
              type="password"
            />
          )}
        />
      </div>
      <button type="submit" className="btn-primary w-full">
        {submitLabel}
      </button>
      <button
        type="button"
        className="btn mt-4 w-full"
        onClick={signInWithGoogle}
      >
        <GoogleIcon className="inline-block w-6 h-6 mr-2" />
        {submitLabel} avec Google
      </button>
      {children}
    </form>
  );
}
