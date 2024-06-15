'use client';

import { Field } from '@couture-next/ui/form/Field';
import { ButtonWithLoading } from '@couture-next/ui/ButtonWithLoading';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from 'apps/storefront/contexts/AuthContext';
import clsx from 'clsx';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { z } from 'zod';
import { trpc } from 'apps/storefront/trpc-client';

const profileSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email('Email non valide'),
});

type ProfileDetailsFormType = z.infer<typeof profileSchema>;

export function ProfileDetailsForm() {
  const { userQuery } = useAuth();
  const form = useForm<ProfileDetailsFormType>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      email: userQuery.data?.email ?? undefined,
      firstName: userQuery.data?.firstName ?? undefined,
      lastName: userQuery.data?.lastName ?? undefined,
    },
  });

  const trpcUtils = trpc.useUtils();
  const editProfileMutation = trpc.users.update.useMutation({
    async onSuccess() {
      await trpcUtils.users.invalidate();
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      await editProfileMutation.mutateAsync(data);
      form.reset(data);
      toast('Ton profil a été mis à jour', { icon: '🎉' });
    } catch (error) {
      form.setError('root', { message: 'Une erreur est survenue, impossible de mettre à jour ton profil' });
    }
  });

  if (!userQuery.data) return null;

  return (
    <div>
      <h2 className="text-2xl font-serif mb-6">Mes informations</h2>
      <form className="grid grid-cols-[auto_1fr] gap-4" onSubmit={onSubmit}>
        <Field
          label="Prénom"
          widgetId="firstName"
          error={form.formState.errors.firstName?.message}
          renderWidget={(className) => <input {...form.register('firstName')} required className={className} />}
        />
        <Field
          label="Nom"
          widgetId="lastName"
          error={form.formState.errors.lastName?.message}
          renderWidget={(className) => <input {...form.register('lastName')} required className={className} />}
        />
        <Field
          label="Email"
          widgetId="email"
          error={form.formState.errors.email?.message}
          renderWidget={(className) => (
            <input
              {...form.register('email')}
              required
              className={clsx(className, 'opacity-50 cursor-not-allowed')}
              disabled
            />
          )}
        />
        {form.formState.errors.root && (
          <div className="col-span-full text-red-500">{form.formState.errors.root.message}</div>
        )}
        <ButtonWithLoading
          loading={form.formState.isSubmitting}
          type="submit"
          className={clsx(
            'btn-primary col-span-full mx-auto',
            !form.formState.isDirty && 'opacity-50 pointer-events-none'
          )}
        >
          Enregistrer
        </ButtonWithLoading>
      </form>
    </div>
  );
}
