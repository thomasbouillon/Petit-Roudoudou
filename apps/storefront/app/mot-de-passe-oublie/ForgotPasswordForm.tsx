'use client';

import { Field } from '@couture-next/ui/form/Field';
import { ButtonWithLoading } from '@couture-next/ui/ButtonWithLoading';
import { zodResolver } from '@hookform/resolvers/zod';
import { trpc } from 'apps/storefront/trpc-client';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Email invalide'),
});

type SchemaType = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const emailInQuery = useSearchParams().get('email');
  const form = useForm<SchemaType>({
    defaultValues: {
      email: emailInQuery ?? undefined,
    },
    resolver: zodResolver(schema),
  });

  const sendResetPasswordEmailMutation = trpc.auth.sendResetPasswordEmail.useMutation();

  const onSubmit = form.handleSubmit(async ({ email }) => {
    await sendResetPasswordEmailMutation
      .mutateAsync(email)
      .then(() => {
        toast.success('Un email a été envoyé avec un lien pour réinitialiser ton mot de passe.');
      })
      .catch((e) => {
        console.error(e);
        form.setError('root', {
          message: 'Une erreur est survenue. Réessaye plus tard.',
        });
      });
  });

  return (
    <form onSubmit={onSubmit}>
      <Field
        label="Adresse email"
        widgetId="email"
        labelClassName="!items-start"
        error={form.formState.errors.email?.message}
        renderWidget={(className) => <input type="email" className={className} required {...form.register('email')} />}
      />
      <p className="text-red-500 text-sm mt-2">{form.formState.errors.root?.message}</p>
      <ButtonWithLoading loading={form.formState.isLoading} type="submit" className="btn-primary mx-auto mt-4">
        Envoyer
      </ButtonWithLoading>
    </form>
  );
}
