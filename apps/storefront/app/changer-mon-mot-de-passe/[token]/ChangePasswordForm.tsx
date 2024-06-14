'use client';

import { routes } from '@couture-next/routing';
import { Field } from '@couture-next/ui/form/Field';
import { ButtonWithLoading } from '@couture-next/ui/ButtonWithLoading';
import { zodResolver } from '@hookform/resolvers/zod';
import { trpc } from 'apps/storefront/trpc-client';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { z } from 'zod';

const schema = z.object({
  newPassword: z.string().min(6, "Essaie avec au moins 6 caractères, c'est plus sûr !"),
});

type SchemaType = z.infer<typeof schema>;

export function ChangePasswordForm({ token }: { token: string }) {
  const trpcUtils = trpc.useUtils();
  const router = useRouter();

  const sendResetPasswordEmailMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      trpcUtils.auth.me.invalidate();
    },
  });

  const form = useForm<SchemaType>({
    resolver: zodResolver(schema),
  });

  const onSubmit = form.handleSubmit(async ({ newPassword }) => {
    await sendResetPasswordEmailMutation
      .mutateAsync({
        token,
        newPassword,
      })
      .then(() => {
        toast.success('Bien joué !');
        router.push(routes().shop().index());
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
        label="Nouveau mot de passe"
        widgetId="newPassword"
        labelClassName="!items-start"
        error={form.formState.errors.newPassword?.message}
        renderWidget={(className) => (
          <input id="password" type="password" className={className} required {...form.register('newPassword')} />
        )}
      />
      <p className="text-red-500 text-sm mt-2">{form.formState.errors.root?.message}</p>
      <ButtonWithLoading loading={form.formState.isLoading} type="submit" className="btn-primary mx-auto mt-4">
        Changer
      </ButtonWithLoading>
    </form>
  );
}
