'use client';

import { ButtonWithLoading, Field } from '@couture-next/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from 'apps/storefront/contexts/AuthContext';
import { FirebaseError } from 'firebase/app';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { z } from 'zod';

const profileSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email('Email non valide'),
});

type ProfileDetailsFormType = z.infer<typeof profileSchema>;

export function ProfileDetailsForm() {
  const { userQuery, editProfileMutation, errorFromCode } = useAuth();
  const form = useForm<ProfileDetailsFormType>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      email: userQuery.data?.email ?? undefined,
      firstName: userQuery.data?.displayName?.split(' ')[0],
      lastName: userQuery.data?.displayName?.split(' ')[1],
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      await editProfileMutation.mutateAsync({
        displayName: `${data.firstName} ${data.lastName}`,
        email: data.email,
      });
      toast('Votre profil a été mis à jour', { icon: '🎉' });
    } catch (error) {
      if (error instanceof FirebaseError) {
        form.setError('root', { message: errorFromCode(error.code) });
      } else {
        form.setError('root', { message: 'Une erreur est survenue, impossible de mettre à jour votre profil' });
      }
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
          renderWidget={(className) => <input {...form.register('email')} required className={className} />}
        />
        {form.formState.errors.root && (
          <div className="col-span-full text-red-500">{form.formState.errors.root.message}</div>
        )}
        <ButtonWithLoading
          loading={form.formState.isSubmitting}
          type="submit"
          className="btn-primary col-span-full mx-auto"
        >
          Enregistrer
        </ButtonWithLoading>
      </form>
    </div>
  );
}
