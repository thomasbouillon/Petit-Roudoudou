import { Tab } from '@headlessui/react';
import clsx from 'clsx';
import React, { Fragment, PropsWithChildren, useCallback } from 'react';
import GeneralPropsFields from './generalPropsFields';
import SeoPropsFields from './seoPropsFields';
import z from 'zod';
import { UseFormReset, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import ImagesPropsFields from './imagesPropsFields';
import { Spinner } from '@couture-next/ui';
import { v4 as uuid } from 'uuid';
import CharacteristicFields from './characteristicFields';
import SKUFields from './skuFields';

const schema = z.object({
  name: z.string().min(3, 'Le nom doit faire au moins 3 caractères'),
  characteristics: z.record(
    z.object({
      label: z.string().min(3, 'Le nom doit faire au moins 3 caractères'),
      values: z.record(
        z.string().min(1, 'La valeur doit faire au moins 1 caractère')
      ),
    })
  ),
  description: z
    .string()
    .min(3, 'La description doit faire au moins 3 caractères'),
  seo: z.object({
    title: z.string().min(3, 'Le nom doit faire au moins 3 caractères'),
    description: z
      .string()
      .min(3, 'La description doit faire au moins 3 caractères'),
  }),
  skus: z.array(
    z.object({
      characteristics: z.record(z.string()),
      price: z.number().min(0.01, 'Le prix doit être supérieur à 0.01'),
      stock: z
        .number()
        .min(0, 'Si précisé, le stock ne peut être négatif')
        .nullish(),
      weight: z.number().min(1, 'Le poids doit être supérieur à 1g'),
      enabled: z.boolean(),
    })
  ),
  images: z
    .array(
      z.object({
        url: z.string().url(),
      })
    )
    .min(1, 'Il faut au moins une image'),
});

export type ArticleFormType = z.infer<typeof schema>;

export type OnSubmitArticleFormCallback = (
  data: ArticleFormType,
  reset: UseFormReset<ArticleFormType>
) => void;

export default function ArticleForm({
  defaultValues,
  onSubmitCallback,
  isLoading,
}: {
  defaultValues?: ArticleFormType;
  onSubmitCallback: OnSubmitArticleFormCallback;
  isLoading?: boolean;
}) {
  const {
    register,
    watch,
    setValue,
    getValues,
    handleSubmit,
    reset,
    unregister,
    control,
    formState: { isDirty, errors },
  } = useForm<ArticleFormType>({
    defaultValues,
    resolver: zodResolver(schema),
  });

  const onSubmit = handleSubmit((data) => onSubmitCallback(data, reset));
  const { append: appendSku } = useFieldArray({
    control,
    name: 'skus',
  });

  const { fields: images, append: appendImage } = useFieldArray({
    control,
    name: 'images',
  });

  const addCharacteristic = useCallback(() => {
    const characteristicId = uuid();
    const valueId = uuid();
    setValue(`characteristics.${characteristicId}`, {
      label: '',
      values: {
        [valueId]: '',
      },
    });
    const skus = getValues('skus');
    skus.forEach((_, i) => {
      setValue(`skus.${i}.characteristics.${characteristicId}`, valueId);
    });
    if (skus.length === 0) {
      appendSku({
        enabled: true,
        price: 0,
        stock: null,
        weight: 0,
        characteristics: {
          [characteristicId]: valueId,
        },
      });
    }
  }, [setValue, getValues, appendSku]);

  return (
    <form
      className="max-w-3xl mx-auto mt-8 shadow-sm bg-white rounded-md px-4 pb-6 border"
      onSubmit={onSubmit}
    >
      <Tab.Group>
        <Tab.List className="flex border-b">
          <div className="flex items-center overflow-x-scroll pt-6 w-full">
            <TabHeader containsErrors={!!errors.name || !!errors.description}>
              Général
            </TabHeader>
            <TabHeader containsErrors={!!errors.images}>Images</TabHeader>
            <TabHeader containsErrors={!!errors.seo}>SEO</TabHeader>
            {Object.entries(watch('characteristics') ?? {}).map(
              ([characteristicId, characteristic]) => (
                <TabHeader
                  key={characteristicId}
                  containsErrors={!!errors.characteristics?.[characteristicId]}
                >
                  {characteristic.label || '[Sans nom]'}
                </TabHeader>
              )
            )}
            <button onClick={addCharacteristic}>
              <PlusIcon className="w-6 h-6" />
            </button>
            <TabHeader containsErrors={!!errors.skus} className="ml-auto">
              SKUs
            </TabHeader>
          </div>
          <button
            type="submit"
            disabled={!isDirty || isLoading}
            className={clsx(
              'ml-auto mr-2 pl-2 mt-6',
              isDirty && 'animate-bounce',
              !isDirty && 'opacity-20 cursor-not-allowed'
            )}
          >
            {!isLoading && (
              <CheckCircleIcon className="h-6 w-6 text-primary-100" />
            )}
            {isLoading && <Spinner className="w-6 h-6 text-primary-100" />}
          </button>
        </Tab.List>
        <Tab.Panels className="p-4">
          <Tab.Panel>
            <GeneralPropsFields register={register} errors={errors} />
          </Tab.Panel>
          <Tab.Panel>
            <ImagesPropsFields
              images={images}
              onUpload={(url) => appendImage({ url })}
              errors={errors}
            />
          </Tab.Panel>
          <Tab.Panel>
            <SeoPropsFields register={register} errors={errors} />
          </Tab.Panel>
          {Object.keys(watch('characteristics') ?? {}).map(
            (characteristicId) => (
              <Tab.Panel
                key={characteristicId}
                // containsErrors={!!errors.characteristics?.[characteristicId]}
              >
                <CharacteristicFields
                  characteristicId={characteristicId}
                  control={control}
                  register={register}
                  watch={watch}
                  setValue={setValue}
                  unregister={unregister}
                  errors={errors}
                  getValues={getValues}
                />
              </Tab.Panel>
            )
          )}
          <Tab.Panel>
            <SKUFields register={register} errors={errors} watch={watch} />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </form>
  );
}

const TabHeader: React.FC<
  PropsWithChildren<{
    containsErrors?: boolean;
    className?: string;
  }>
> = ({ children, containsErrors, className }) => (
  <Tab as={Fragment}>
    {({ selected }) => (
      <span
        className={clsx(
          selected && 'border-b-2',
          'px-6 py-2 cursor-pointer outline-none gap-2 relative',
          className
        )}
      >
        {children}
        {!!containsErrors && (
          <ExclamationTriangleIcon className="w-4 h-4 text-red-500 absolute right-0 top-1/2 -translate-y-[45%]" />
        )}
      </span>
    )}
  </Tab>
);
