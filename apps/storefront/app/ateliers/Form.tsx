import { ButtonWithLoading } from '@couture-next/ui/ButtonWithLoading';
import { Field } from '@couture-next/ui/form/Field';
import { CloseButton } from '@headlessui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Civility } from '@prisma/client';
import { useAuth } from 'apps/storefront/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { z } from 'zod';

type Props = {
  onSubmit: (data: FormData) => Promise<void>;
};

const schema = z.object({
  civility: z.nativeEnum(Civility),
  firstName: z.string(),
  lastName: z.string(),
  address: z.string(),
  addressComplement: z.string(),
  city: z.string(),
  zipCode: z.string(),
  country: z.string(),
});

export type FormData = z.infer<typeof schema>;

export default function Form(props: Props) {
  const { userQuery } = useAuth();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      civility: Civility.MRS,
      country: 'France',
      firstName: userQuery.data?.firstName ?? undefined,
      lastName: userQuery.data?.lastName ?? undefined,
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    await props.onSubmit(data).catch((error) => {
      console.error(error);
      toast.error('Une erreur est survenue lors de la réservation');
    });
  });

  return (
    <form onSubmit={onSubmit} className="">
      <p className="text-center mb-4 underline">Adresse de facturation</p>
      <div className="grid grid-cols-[auto_1fr] gap-4">
        <Field
          label="Civilité"
          widgetId="civility"
          error={form.formState.errors.civility?.message}
          renderWidget={(className) => (
            <select {...form.register('civility')} required className={className}>
              <option value={Civility.MRS}>Mme</option>
              <option value={Civility.MR}>M.</option>
            </select>
          )}
        />
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
          label="Adresse"
          widgetId="address"
          error={form.formState.errors.address?.message}
          renderWidget={(className) => <input {...form.register('address')} required className={className} />}
        />
        <Field
          label="Complément d'adresse"
          widgetId="addressComplement"
          error={form.formState.errors.addressComplement?.message}
          renderWidget={(className) => <input {...form.register('addressComplement')} className={className} />}
        />
        <Field
          label="Code postal"
          widgetId="zipCode"
          error={form.formState.errors.zipCode?.message}
          renderWidget={(className) => <input {...form.register('zipCode')} required className={className} />}
        />
        <Field
          label="Ville"
          widgetId="city"
          error={form.formState.errors.city?.message}
          renderWidget={(className) => <input {...form.register('city')} required className={className} />}
        />
        <Field
          label="Pays"
          widgetId="country"
          error={form.formState.errors.country?.message}
          renderWidget={(className) => <input {...form.register('country')} required className={className} />}
        />
      </div>
      <div className="flex mt-6 gap-2">
        <CloseButton className="btn-secondary basis-1/2">Annuler</CloseButton>
        <ButtonWithLoading
          className="btn-primary mx-auto  basis-1/2"
          loading={form.formState.isSubmitting}
          disabled={form.formState.isSubmitting}
          type="submit"
        >
          Réserver
        </ButtonWithLoading>
      </div>
    </form>
  );
}
