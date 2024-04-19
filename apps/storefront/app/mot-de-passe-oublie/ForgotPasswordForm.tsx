'use client';

// import { ButtonWithLoading, Field } from '@couture-next/ui';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { useAuth } from 'apps/storefront/contexts/AuthContext';
// import { FirebaseError } from 'firebase/app';
// import { sendPasswordResetEmail } from 'firebase/auth';
// import { useSearchParams } from 'next/navigation';
// import { useCallback } from 'react';
// import { useForm } from 'react-hook-form';
// import toast from 'react-hot-toast';
// import { z } from 'zod';

// const schema = z.object({
//   email: z.string().email('Email invalide'),
// });

// type SchemaType = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  return <p>Pas encore disponible</p>;
  // const { sendResetPasswordEmailMutation, errorFromCode } = useAuth();

  // const emailInQuery = useSearchParams().get('email');
  // const form = useForm<SchemaType>({
  //   defaultValues: {
  //     email: emailInQuery ?? undefined,
  //   },
  //   resolver: zodResolver(schema),
  // });

  // const onSubmit = form.handleSubmit(async ({ email }) => {
  //   await sendResetPasswordEmailMutation
  //     .mutateAsync({ email })
  //     .then(() => {
  //       toast.success('Un email vous a été envoyé avec un lien pour réinitialiser votre mot de passe.');
  //     })
  //     .catch((e) => {
  //       console.error(e);
  //       if (e instanceof FirebaseError) {
  //         form.setError('root', {
  //           message: errorFromCode(e.code),
  //         });
  //       } else {
  //         form.setError('root', {
  //           message: 'Une erreur est survenue. Veuillez réessayer plus tard.',
  //         });
  //       }
  //     });
  // });

  // return (
  //   <form onSubmit={onSubmit}>
  //     <Field
  //       label="Adresse email"
  //       widgetId="email"
  //       labelClassName="!items-start"
  //       error={form.formState.errors.email?.message}
  //       renderWidget={(className) => <input type="email" className={className} required {...form.register('email')} />}
  //     />
  //     <p className="text-red-600 text-sm mt-2">{form.formState.errors.root?.message}</p>
  //     <ButtonWithLoading loading={form.formState.isLoading} type="submit" className="btn-primary mx-auto mt-4">
  //       Envoyer
  //     </ButtonWithLoading>
  //   </form>
  // );
}
