import { ImagesField } from '@couture-next/ui/form/ImagesField';
import { Field } from '@couture-next/ui/form/Field';
import { Spinner } from '@couture-next/ui/Spinner';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import { FormProvider, UseFormReset, useForm } from 'react-hook-form';
import { z } from 'zod';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import SelectFabricGroupsWidget from './selectFabricGroupsWidget';
import { loader } from '../../../utils/next-image-firebase-storage-loader';
import SelectTags from './selectFabricTagsWidget';
import useStorage from 'apps/storefront/hooks/useStorage';

type Props = {
  defaultValues?: FabricFormType;
  isPending?: boolean;
  onSubmitCallback: OnSubmitFabricFormCallback;
};

export type OnSubmitFabricFormCallback = (data: FabricFormType, reset: UseFormReset<FabricFormType>) => void;

const schema = z.object({
  name: z.string().min(1, 'Le nom est obligatoire'),
  image: z.object({
    url: z.string().min(1, "L'image est obligatoire"),
    uid: z.string().min(1, "L'image est obligatoire"),
  }),
  enabled: z.boolean(),
  previewImage: z
    .object({
      url: z.string().min(1, "L'image est obligatoire"),
      uid: z.string().min(1, "L'image est obligatoire"),
    })
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  groupIds: z.array(z.string().min(1)),
  size: z
    .array(z.number().min(1, 'La taille est obligatoire'))
    .length(2)
    .transform((value) => {
      if (value.length === 2) return value as [number, number];
      throw new Error('Impossible');
    }),
  tagIds: z.array(z.string().min(1)),
});

export type FabricFormType = z.infer<typeof schema>;

export function Form({ defaultValues, onSubmitCallback, isPending }: Props) {
  const form = useForm<FabricFormType>({
    defaultValues,
    resolver: zodResolver(schema),
  });
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    reset,
    watch,
  } = form;
  const onSubmit = handleSubmit((data) => onSubmitCallback(data, reset));

  const { handleUpload } = useStorage();

  const SubmitButton = (
    <button
      type="submit"
      disabled={!isDirty || isPending}
      className={clsx(isDirty && 'animate-bounce', !isDirty && 'opacity-20 cursor-not-allowed')}
    >
      {!isPending && <CheckCircleIcon className="h-6 w-6 text-primary-100" />}
      {isPending && <Spinner className="w-6 h-6 text-primary-100" />}
    </button>
  );

  return (
    <FormProvider {...form}>
      <form className="max-w-3xl mx-auto mt-8 shadow-sm bg-white rounded-md border pt-4" onSubmit={onSubmit}>
        <div className="flex justify-end mb-4 border-b px-4 pb-4">{SubmitButton}</div>
        <div className="grid grid-cols-[auto_1fr] gap-4 px-4">
          <Field
            label="Nom du tissu"
            error={errors.name?.message}
            labelClassName="min-w-[min(30vw,15rem)]"
            widgetId="name"
            renderWidget={(className) => <input type="text" id="name" className={className} {...register('name')} />}
          />
          <Field
            label="Actif"
            error={errors.name?.message}
            helpText="Si le tissu est actif, il sera disponible à la personnalisation"
            labelClassName="min-w-[min(30vw,15rem)]"
            widgetId="enabled"
            renderWidget={(className) => (
              <input type="checkbox" id="enabled" className={className} {...register('enabled')} />
            )}
          />
          <Field
            label="Image"
            error={errors.image?.url?.message}
            labelClassName="min-w-[min(30vw,15rem)]"
            widgetId="image"
            helpText="Image qui sert uniquement pour le modèle 3D"
            renderWidget={(className) => (
              <div className={className}>
                <ImagesField
                  formControlKey="image"
                  uploadFile={handleUpload}
                  imageLoader={loader}
                  ui={{ filesContainerClassName: 'justify-center', addFileButtonClassName: 'btn-light mx-auto' }}
                />
              </div>
            )}
          />
          <Field
            label="Image d'aperçu"
            error={errors.previewImage?.url?.message}
            labelClassName="min-w-[min(30vw,15rem)]"
            widgetId="previewImage"
            helpText="Image qui sera affichée dans la page des tissus"
            renderWidget={(className) => (
              <div className={className}>
                <ImagesField
                  formControlKey="previewImage"
                  uploadFile={handleUpload}
                  imageLoader={loader}
                  ui={{ filesContainerClassName: 'justify-center', addFileButtonClassName: 'btn-light mx-auto' }}
                />
                <div className="text-center">(vide pour utiliser l'image principale)</div>
              </div>
            )}
          />
          <Field
            label="Groupes"
            helpText="Sert pour les choix de tissus des articles"
            widgetId="groups"
            renderWidget={(className) => (
              <SelectFabricGroupsWidget className={className} setValue={setValue} watch={watch} />
            )}
          />

          <Field
            label="Tags"
            helpText="Uniquement pour des indications sur la page de tissus"
            widgetId="tags"
            renderWidget={(className) => <SelectTags className={className} setValue={setValue} watch={watch} />}
          />

          <Field
            label="Taille de l'image"
            helpText="Permet de mettre le motif à l'échelle dans un rendu 3D"
            widgetId="groups"
            renderWidget={(className) => (
              <div className={clsx(className, 'grid grid-cols-[auto_1fr_auto_1fr_auto] gap-2')}>
                L:
                <input
                  type="number"
                  min={0}
                  step={1}
                  {...register('size.0', { valueAsNumber: true })}
                  className="w-full number-controls-hidden"
                />
                l:
                <input
                  type="number"
                  min={0}
                  step={1}
                  {...register('size.1', { valueAsNumber: true })}
                  className="w-full number-controls-hidden"
                />
                cm
              </div>
            )}
          />
        </div>
        <div className="flex justify-end mb-4 border-t px-4 pt-4 mt-8">{SubmitButton}</div>
      </form>
    </FormProvider>
  );
}
