import { Tab } from '@headlessui/react';
import clsx from 'clsx';
import React, {
  Fragment,
  PropsWithChildren,
  useCallback,
  useMemo,
} from 'react';
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
import FabricsFields from './customizablePartsFields';
import StockPropsFields from './stockPropsFields';

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
  customizables: z.array(
    z.object({
      uid: z.string().nonempty(),
      label: z.string().nonempty('Le nom est requis'),
      type: z.enum(['customizable-part']),
      fabricListId: z.string().nonempty('Le group de tissu est requis'),
      size: z
        .array(z.number())
        .length(2)
        .transform((value) => {
          if (value.length === 2) return value as [number, number];
          throw new Error('Impossible');
        }),
      treeJsModelPartId: z
        .string()
        .nonempty("L'identifiant dans le modèle 3D est requis"),
    })
  ),
  description: z
    .string()
    .min(3, 'La description doit faire au moins 3 caractères'),
  treeJsModel: z.object({
    url: z.string().url(),
    uid: z.string().nonempty('Model 3D requis'),
  }),
  seo: z.object({
    title: z.string().min(3, 'Le nom doit faire au moins 3 caractères'),
    description: z
      .string()
      .min(3, 'La description doit faire au moins 3 caractères'),
  }),
  skus: z.array(
    z.object({
      uid: z.string().nonempty(),
      characteristics: z.record(z.string().nonempty()),
      price: z.number().min(0.01, 'Le prix doit être supérieur à 0.01'),
      weight: z.number().min(1, 'Le poids doit être supérieur à 1g'),
      enabled: z.boolean(),
    })
  ),
  images: z
    .array(
      z.object({
        url: z.string().url(),
        uid: z.string().nonempty(),
        placeholderDataUrl: z.string().optional(), // keep this to not erase the field
      })
    )
    .min(1, 'Il faut au moins une image'),
  stocks: z.array(
    z.object({
      uid: z.string().nonempty(),
      sku: z.string().nonempty('Doit correspondre à un SKU existant'),
      stock: z.number().min(0, 'Le stock ne peut être négatif'),
      images: z
        .array(
          z.object({
            url: z.string().url(),
            uid: z.string().nonempty(),
            placeholderDataUrl: z.string().optional(), // keep this to not erase the field
          })
        )
        .min(1, 'Il faut au moins une image'),
      title: z.string().min(3, 'Le titre doit faire au moins 3 caractères'),
      description: z
        .string()
        .min(3, 'La description doit faire au moins 3 caractères'),
    })
  ),
});

export type ArticleFormType = z.infer<typeof schema>;

export type OnSubmitArticleFormCallback = (
  data: ArticleFormType,
  reset: UseFormReset<ArticleFormType>
) => void;

export function Form({
  defaultValues,
  onSubmitCallback,
  isPending,
}: {
  defaultValues?: ArticleFormType;
  onSubmitCallback: OnSubmitArticleFormCallback;
  isPending?: boolean;
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

  const {
    fields: images,
    append: appendImage,
    update: updateImage,
  } = useFieldArray({
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
        uid: uuid(),
        enabled: true,
        price: 0,
        weight: 0,
        characteristics: {
          [characteristicId]: valueId,
        },
      });
    }
  }, [setValue, getValues, appendSku]);

  const hasFabricsErrors = useMemo(
    () =>
      Object.values(errors.customizables ?? {}).some(
        (customizableErrors, i) =>
          getValues(`customizables.${i}.type`) === 'customizable-part' &&
          Object.values(
            customizableErrors as unknown as Record<string, unknown>
          ).length > 0
      ),
    [errors, getValues]
  );

  return (
    <form
      className="max-w-3xl mx-auto mt-8 shadow-sm bg-white rounded-md px-4 pb-6 border"
      onSubmit={onSubmit}
    >
      <Tab.Group>
        <Tab.List className="flex border-b">
          <div className="flex items-center overflow-x-scroll pt-6 w-full">
            <TabHeader
              containsErrors={
                !!errors.name || !!errors.description || !!errors.treeJsModel
              }
            >
              Général
            </TabHeader>
            <TabHeader containsErrors={!!errors.images}>Images</TabHeader>
            <TabHeader containsErrors={!!errors.stocks}>Stocks</TabHeader>
            <TabHeader containsErrors={!!errors.seo}>SEO</TabHeader>
            <TabHeader containsErrors={hasFabricsErrors}>Tissus</TabHeader>
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
            disabled={!isDirty || isPending}
            className={clsx(
              'ml-auto mr-2 pl-2 mt-6',
              isDirty && !isPending && 'animate-bounce',
              !isDirty && 'opacity-20 cursor-not-allowed'
            )}
          >
            {!isPending && (
              <CheckCircleIcon className="h-6 w-6 text-primary-100" />
            )}
            {isPending && <Spinner className="w-6 h-6 text-primary-100" />}
          </button>
        </Tab.List>
        <Tab.Panels className="p-4 overflow-x-scroll">
          <Tab.Panel>
            <GeneralPropsFields
              register={register}
              errors={errors}
              setValue={setValue}
              watch={watch}
            />
          </Tab.Panel>
          <Tab.Panel>
            <ImagesPropsFields
              images={images}
              onUpload={(image) => appendImage(image)}
              onImageChange={updateImage}
              errors={errors}
            />
          </Tab.Panel>
          <Tab.Panel>
            <StockPropsFields
              control={control}
              watch={watch}
              errors={errors}
              setValue={setValue}
              getValues={getValues}
            />
          </Tab.Panel>
          <Tab.Panel>
            <SeoPropsFields register={register} errors={errors} />
          </Tab.Panel>
          <Tab.Panel>
            <FabricsFields control={control} watch={watch} errors={errors} />
          </Tab.Panel>
          {Object.keys(watch('characteristics') ?? {}).map(
            (characteristicId) => (
              <Tab.Panel key={characteristicId}>
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
