'use client';

import { ButtonWithLoading } from '@couture-next/ui/ButtonWithLoading';
import { Field } from '@couture-next/ui/form/Field';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';
import TrackingLinkQrCode from './TrackingLingQrCode';
import { trpc } from 'apps/storefront/trpc-client';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const schema = z.object({
  name: z.string(),
  pathname: z.string(),
  utm: z.object({
    source: z.string(),
    medium: z.string(),
    campaign: z.string(),
    content: z.string(),
    // term: z.string(),
  }),
  qrCodeSize: z.number().int().min(1).max(1024),
});

export type TrackingLinkForm = z.infer<typeof schema>;

type Props = {
  defaultValues?: TrackingLinkForm;
  onSubmitCallback: (data: TrackingLinkForm) => Promise<void>;
};

export default function Form({ defaultValues, onSubmitCallback }: Props) {
  const form = useForm<TrackingLinkForm>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await onSubmitCallback(values);
    form.reset(values);
    toast.success('Sauvegardé');
  });

  return (
    <FormProvider {...form}>
      <form
        className="max-w-3xl mx-auto mt-8 shadow-sm bg-white rounded-md border pt-4 space-y-6 py-4"
        onSubmit={onSubmit}
      >
        <h2 className="font-bold text-center">Cas d'usage</h2>
        <p className="max-w-sm mx-auto">
          Tu as une boutique partenaire avec 2 zones de flyers différentes. Tu vas donc avoir 2 liens différents pour la
          même boutique partenaire.
          <div>
            <strong>Exemple:</strong>
            <ul>
              <li>
                <strong>Source:</strong> Boutique "C'est papa qui l'a dit"
              </li>
              <li>
                <strong>Medium:</strong> Flyer
              </li>
              <li>
                <strong>Campagne:</strong> Boutiques partenaires Nancy
              </li>
              <li>
                <strong>Différenciateur:</strong> Flyer porte d'entrée
              </li>
            </ul>
          </div>
        </p>
        <div className="grid grid-cols-[auto_1fr] gap-4 px-4">
          <Field
            label="Nom du lien"
            widgetId="name"
            renderWidget={(className) => <input {...form.register('name')} className={className} />}
          />
          <Field
            label="URL de destination"
            helpText='Sans "https://www.petit-roudoudou.fr"'
            widgetId="pathname"
            renderWidget={(className) => (
              <input {...form.register('pathname')} className={className} placeholder="ex: / ou /boutique ou /blog" />
            )}
          />
          <Field
            label="Source"
            helpText="Permet d'identifier la source du trafic. Exemple: Boutique partenaire, Marché, ..."
            widgetId="source"
            renderWidget={(className) => <input {...form.register('utm.source')} className={className} />}
          />
          <Field
            label="Medium"
            helpText="Permet de définir le support qui a permis à la source de venir, exemple: email, flyer, ..."
            widgetId="medium"
            renderWidget={(className) => <input {...form.register('utm.medium')} className={className} />}
          />
          <Field
            label="Campagne"
            helpText="Permet de grouper les liens par campagne. Exemple: Collection été 2024, Soldes 2024, ..."
            widgetId="campaign"
            renderWidget={(className) => <input {...form.register('utm.campaign')} className={className} />}
          />
          <Field
            label="Différenciateur"
            helpText="Permet de définir quel élément a permis de générer le lien. Exemple: flyer porte de magasin, flyer distribué, ..."
            widgetId="content"
            renderWidget={(className) => <input {...form.register('utm.content')} className={className} />}
          />
          <Field
            label="Taille du QR Code"
            helpText="Taille en pixels du QR Code"
            widgetId="qrCodeSize"
            renderWidget={(className) => (
              <input
                {...form.register('qrCodeSize', { valueAsNumber: true })}
                type="number"
                max={1024}
                step={1}
                min={64}
                className={className}
              />
            )}
          />
        </div>
        <ButtonWithLoading
          loading={form.formState.isSubmitting}
          type="submit"
          className={clsx('btn-primary mx-auto', !form.formState.isDirty && 'opacity-50 cursor-not-allowed')}
          disabled={!form.formState.isDirty || form.formState.isSubmitting}
        >
          Sauvegarder
        </ButtonWithLoading>

        <TrackingLinkQrCode />
      </form>
    </FormProvider>
  );
}
