import { Field, ImagesField, Spinner } from '@couture-next/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import { FormProvider, UseFormReset, useForm } from 'react-hook-form';
import { z } from 'zod';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { loader } from '../../../utils/next-image-firebase-storage-loader';
import useStorage from 'apps/storefront/hooks/useStorage';

type Props = {
  defaultValues?: EmbroideryColorFormType;
  isPending?: boolean;
  onSubmitCallback: OnSubmitEmbroideryColorFormCallback;
};

export type OnSubmitEmbroideryColorFormCallback = (
  data: EmbroideryColorFormType,
  reset: UseFormReset<EmbroideryColorFormType>
) => void;

const schema = z.object({
  name: z.string().min(1, 'Le nom est obligatoire'),
  image: z.object({
    url: z.string().min(1, "L'image est obligatoire"),
    uid: z.string().min(1, "L'image est obligatoire"),
  }),
});

export type EmbroideryColorFormType = z.infer<typeof schema>;

export function Form({ defaultValues, onSubmitCallback, isPending }: Props) {
  const form = useForm<EmbroideryColorFormType>({
    defaultValues,
    resolver: zodResolver(schema),
  });
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
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
            label="Nom de la couleur"
            error={errors.name?.message}
            labelClassName="min-w-[min(30vw,15rem)]"
            widgetId="name"
            renderWidget={(className) => <input type="text" id="name" className={className} {...register('name')} />}
          />
          <Field
            label="Image"
            error={errors.image?.url?.message}
            labelClassName="min-w-[min(30vw,15rem)]"
            widgetId="image"
            helpText="Image affichée dans la popup pour choisir une couleur"
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
        </div>
        <div className="flex justify-end mb-4 border-t px-4 pt-4 mt-8">{SubmitButton}</div>
      </form>
    </FormProvider>
  );
}
