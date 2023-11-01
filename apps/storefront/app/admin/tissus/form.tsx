import { Field, Spinner } from '@couture-next/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import Image from 'next/image';
import { useState } from 'react';
import { UseFormReset, useForm } from 'react-hook-form';
import { z } from 'zod';
import UploadImageModal from '../creations/uploadFileModal';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import SelectFabricGroupsWidget from './selectFabricGroupsWidget';
import { loader } from '../../../utils/next-image-firebase-storage-loader';

type Props = {
  defaultValues?: FabricFormType;
  isLoading?: boolean;
  onSubmitCallback: OnSubmitFabricFormCallback;
};

export type OnSubmitFabricFormCallback = (
  data: FabricFormType,
  reset: UseFormReset<FabricFormType>
) => void;

const schema = z.object({
  name: z.string().nonempty('Le nom est obligatoire'),
  image: z.object({
    url: z.string().nonempty("L'image est obligatoire"),
    id: z.string().nonempty("L'image est obligatoire"),
  }),
  groupIds: z.array(z.string().nonempty()),
  size: z
    .array(z.number().min(1, 'La taille est obligatoire'))
    .length(2)
    .transform((value) => {
      if (value.length === 2) return value as [number, number];
      throw new Error('Impossible');
    }),
});

export type FabricFormType = z.infer<typeof schema>;

export function Form({ defaultValues, onSubmitCallback, isLoading }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    reset,
    watch,
  } = useForm<FabricFormType>({
    defaultValues,
    resolver: zodResolver(schema),
  });
  const onSubmit = handleSubmit((data) => onSubmitCallback(data, reset));
  const [openModal, setOpenModal] = useState(false);

  const onUpload = (url: string, id: string) => {
    setValue('image.url', url, { shouldDirty: true });
    setValue('image.id', id, { shouldDirty: true });
    setOpenModal(false);
  };

  return (
    <form
      className="max-w-3xl mx-auto mt-8 shadow-sm bg-white rounded-md border pb-8 pt-4"
      onSubmit={onSubmit}
    >
      <div className="flex justify-end mb-4 border-b px-4 pb-4">
        <button
          type="submit"
          disabled={!isDirty || isLoading}
          className={clsx(
            isDirty && 'animate-bounce',
            !isDirty && 'opacity-20 cursor-not-allowed'
          )}
        >
          {!isLoading && (
            <CheckCircleIcon className="h-6 w-6 text-primary-100" />
          )}
          {isLoading && <Spinner className="w-6 h-6 text-primary-100" />}
        </button>
      </div>
      <div className="grid grid-cols-[auto_1fr] gap-4 px-4">
        <Field
          label="Nom du tissu"
          error={errors.name?.message}
          labelClassName="min-w-[min(30vw,15rem)]"
          widgetId="name"
          renderWidget={(className) => (
            <input
              type="text"
              id="name"
              className={className}
              {...register('name')}
            />
          )}
        />
        <Field
          label="Image"
          error={errors.image?.url?.message}
          labelClassName="min-w-[min(30vw,15rem)]"
          widgetId="name"
          renderWidget={(className) =>
            watch('image.url') ? (
              <Image
                alt=""
                src={watch('image.url')}
                loader={
                  watch('image.id').startsWith('uploaded/') ? undefined : loader
                }
                width={256}
                height={256}
                className={clsx(className, 'w-64 h-64 object-contain mx-auto')}
                onClick={() => setOpenModal(true)}
              />
            ) : (
              <button
                type="button"
                className={clsx('btn-light', className)}
                onClick={() => setOpenModal(true)}
              >
                Ajouter une image
              </button>
            )
          }
        />
        <Field
          label="Groupes"
          widgetId="groups"
          renderWidget={(className) => (
            <SelectFabricGroupsWidget
              className={className}
              setValue={setValue}
              watch={watch}
            />
          )}
        />

        <Field
          label="Taille de l'image"
          helpText="Permet de mettre le motif à l'échelle dans un rendu 3D"
          widgetId="groups"
          renderWidget={(className) => (
            <div
              className={clsx(
                className,
                'grid grid-cols-[auto_1fr_auto_1fr_auto] gap-2'
              )}
            >
              L:
              <input
                type="number"
                min={0}
                step={1}
                {...register('size.0', { valueAsNumber: true })}
                className="w-full"
              />
              l:
              <input
                type="number"
                min={0}
                step={1}
                {...register('size.1', { valueAsNumber: true })}
                className="w-full"
              />
              cm
            </div>
          )}
        />
      </div>
      <UploadImageModal
        title="Ajouter une image"
        buttonLabel="Ajouter l'image"
        renderPreview={(url) => (
          <img
            className="absolute top-0 left-0 w-full h-full object-contain bg-gray-100 object-center"
            src={url}
          />
        )}
        isOpen={openModal}
        close={() => setOpenModal(false)}
        onUploaded={onUpload}
      />
    </form>
  );
}
