import { TRPCRouterInput } from '@couture-next/api-connector';
import { Field } from '@couture-next/ui/form/Field';
import { ImagesField } from '@couture-next/ui/form/ImagesField';
import { Spinner } from '@couture-next/ui/Spinner';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { zodResolver } from '@hookform/resolvers/zod';
import useStorage from 'apps/storefront/hooks/useStorage';
import { loader } from 'apps/storefront/utils/next-image-firebase-storage-loader';
import clsx from 'clsx';
import { DefaultValues, FormProvider, useForm } from 'react-hook-form';
import { ZodType, z } from 'zod';
import DatePicker from './DatePicker';

export type WorkshopSessionDTO = TRPCRouterInput['workshopSessions']['create'];

const schema = z
  .object({
    title: z.string().min(3, 'Le titre doit contenir au moins 3 caractères'),
    description: z.string().min(3, 'La description doit contenir au moins 3 caractères'),
    leaderName: z.string().min(1, "Le nom de l'animateur doit contenir au moins 1 caractère"),
    startDate: z.coerce
      .date({
        message: 'Date invalide',
      })
      .min(new Date(), 'La date doit être dans le futur'),
    endDate: z.coerce.date({
      message: 'Date invalide',
    }),
    maxCapacity: z.number().int().min(1),
    image: z.object({
      uid: z.string().min(1, 'Une image est requise'),
      url: z.string(),
    }),
    price: z.number().min(0),
    location: z.string().min(1, 'Le lieu doit contenir au moins 1 caractère'),
  })
  .superRefine((data, ctx) => {
    console.log(data.startDate, data.endDate);
    if (new Date(data.startDate) >= new Date(data.endDate)) {
      ctx.addIssue({
        code: 'invalid_date',
        message: 'La date de fin doit être après la date de début',
        path: ['endDate'],
      });
    }
  }) satisfies ZodType<
  Omit<WorkshopSessionDTO, 'image'> & { image: { uid: string; url: string } },
  z.ZodTypeDef,
  unknown
>;

export type WorkshopSessionFormType = z.infer<typeof schema>;

export type Props = {
  onSubmit: (data: WorkshopSessionFormType) => void;
  defaultValues?: DefaultValues<WorkshopSessionFormType>;
};

export default function Form({ onSubmit, defaultValues }: Props) {
  const form = useForm<WorkshopSessionFormType>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const handleSubmit = form.handleSubmit(onSubmit);

  const { handleUpload } = useStorage();

  const SubmitButton = (
    <button
      type="submit"
      disabled={!form.formState.isDirty || form.formState.isSubmitting}
      className={clsx(
        form.formState.isDirty && !form.formState.isSubmitting && 'animate-bounce',
        !form.formState.isDirty && 'opacity-20 cursor-not-allowed'
      )}
    >
      {!form.formState.isSubmitting && <CheckCircleIcon className="h-6 w-6 text-primary-100" />}
      {form.formState.isSubmitting && <Spinner className="w-6 h-6 text-primary-100" />}
    </button>
  );

  return (
    <form
      className="max-w-3xl mx-auto mt-8 shadow-sm bg-white rounded-md border pt-4 space-y-4"
      onSubmit={handleSubmit}
    >
      <div className="flex justify-end border-b px-4 pb-4">{SubmitButton}</div>

      <div className="grid grid-cols-[auto_1fr] gap-4 border p-4 mx-4">
        <FormProvider {...form}>
          <Field
            label="Nom de l'atelier"
            error={form.formState.errors.title?.message}
            widgetId="title"
            renderWidget={(className) => <input className={className} {...form.register('title')} />}
          />
          <Field
            label="Nom de l'animateur"
            helpText="Personne, entreprise... qui animera l'atelier."
            error={form.formState.errors.leaderName?.message}
            widgetId="leaderName"
            renderWidget={(className) => <input className={className} required {...form.register('leaderName')} />}
          />
          <Field
            label="Description"
            error={form.formState.errors.description?.message}
            widgetId="description"
            renderWidget={(className) => <textarea className={className} required {...form.register('description')} />}
          />
          <Field
            label="Date de début"
            error={form.formState.errors.startDate?.message}
            widgetId="startDate"
            renderWidget={(className) => <DatePicker formControlKey="startDate" className={className} />}
          />
          <Field
            label="Date de fin"
            error={form.formState.errors.endDate?.message}
            widgetId="endDate"
            renderWidget={(className) => <DatePicker formControlKey="endDate" className={className} />}
          />
          <Field
            label="Capacité maximale"
            error={form.formState.errors.maxCapacity?.message}
            widgetId="maxCapacity"
            renderWidget={(className) => (
              <input
                type="number"
                min={1}
                step={1}
                className={className}
                required
                {...form.register('maxCapacity', { valueAsNumber: true })}
              />
            )}
          />
          <Field
            label="Image"
            error={form.formState.errors.image?.message}
            widgetId="image"
            renderWidget={(className) => (
              <div className={className}>
                <ImagesField formControlKey="image" uploadFile={handleUpload} imageLoader={loader} />
              </div>
            )}
          />

          <Field
            label="Prix"
            error={form.formState.errors.price?.message}
            widgetId="price"
            renderWidget={(className) => (
              <input
                type="number"
                min={0}
                step={0.01}
                required
                className={className}
                {...form.register('price', { valueAsNumber: true })}
              />
            )}
          />
          <Field
            label="Adresse de l'atelier"
            error={form.formState.errors.location?.message}
            widgetId="location"
            renderWidget={(className) => <textarea className={className} required {...form.register('location')} />}
          />
        </FormProvider>
      </div>

      <div className="flex justify-end mb-4 border-t px-4 pt-4 mt-8">{SubmitButton}</div>
    </form>
  );
}
