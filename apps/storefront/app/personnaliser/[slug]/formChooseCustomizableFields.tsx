import { Article } from '@couture-next/types';
import { FieldErrors, UseFormRegister, useController } from 'react-hook-form';
import { AddToCartFormType } from './app';
import clsx from 'clsx';
import { Field } from '@couture-next/ui';
import { applyTaxes } from '@couture-next/utils';
import { Listbox, Popover, Transition } from '@headlessui/react';
import React, { useMemo } from 'react';
import { trpc } from 'apps/storefront/trpc-client';
import Image from 'next/image';
import { loader } from 'apps/storefront/utils/next-image-firebase-storage-loader';
import { InformationCircleIcon } from '@heroicons/react/24/solid';
import { useSearchParams } from 'next/navigation';

type Props = {
  className?: string;
  article: Article;
  register: UseFormRegister<AddToCartFormType>;
  errors: FieldErrors<AddToCartFormType>;
};

export default function FormChooseCustomizableFields({ className, article, register, errors }: Props) {
  const searchParams = useSearchParams();
  const selectedVariantId = searchParams.get('variant');
  const selectedVariant = useMemo(
    () => article.customizableVariants.find((customizableVariant) => customizableVariant.uid === selectedVariantId),
    [article.customizableVariants, selectedVariantId]
  );
  const inheritedCustomizables = useMemo(
    () => article.customizables.filter((customizable) => selectedVariant?.inherits.includes(customizable.uid)),
    [article.customizables, selectedVariant?.inherits]
  );

  if (!selectedVariant) {
    return null;
  }

  return (
    <div className={className}>
      <div>
        {inheritedCustomizables.map((customizable) => (
          <div key={customizable.uid}>
            <Field
              label={customizable.label + (customizable.price ? ` (+${applyTaxes(customizable.price)}€)` : '')}
              labelClassName="!items-start"
              widgetId={customizable.uid}
              error={errors.customizations?.[customizable.uid]?.message}
              renderWidget={(className) =>
                customizable.type === 'customizable-boolean' ? (
                  <input
                    type="checkbox"
                    id={customizable.uid}
                    className={className}
                    {...register(`customizations.${customizable.uid}`)}
                  />
                ) : customizable.type === 'customizable-piping' ? (
                  <ChooseCustomizablePiping customizableUid={customizable.uid} buttonClassName={className} />
                ) : (
                  <input
                    className={clsx('px-4 py-2 border rounded-md', className)}
                    type="text"
                    id={customizable.uid}
                    minLength={customizable.min}
                    maxLength={customizable.max}
                    {...register(`customizations.${customizable.uid}`)}
                  />
                )
              }
            />
          </div>
        ))}
        <Field
          label="Quantité"
          labelClassName="!items-start"
          widgetId="quantity"
          error={errors.quantity?.message}
          renderWidget={(className) => (
            <input
              className={clsx('px-4 py-2 border rounded-md', className)}
              type="number"
              id="quantity"
              {...register(`quantity`, { valueAsNumber: true })}
            />
          )}
        />
      </div>
    </div>
  );
}

function ChooseCustomizablePiping({
  customizableUid,
  buttonClassName,
}: {
  customizableUid: string;
  buttonClassName?: string;
}) {
  const { field } = useController({ name: `customizations.${customizableUid}` });

  const query = trpc.pipings.list.useQuery();
  if (query.error) throw query.error;

  const selectedPiping = useMemo(
    () => query.data?.find((piping) => piping.id === field.value),
    [field.value, query.data]
  );

  return (
    <Listbox value={field.value} onChange={(value) => field.onChange(value)}>
      <div className={clsx('flex items-center mb-6', buttonClassName)}>
        <Listbox.Button className="!outline-none grow">
          {(selectedPiping && (
            <div className="flex items-center gap-6">
              <Image
                src={selectedPiping.image.url}
                width={64}
                height={64}
                alt={selectedPiping.name}
                loader={loader}
                placeholder={selectedPiping.image.placeholderDataUrl ? 'blur' : 'empty'}
                blurDataURL={selectedPiping.image.placeholderDataUrl ?? undefined}
              />
              <span className="underline">Changer le passepoil</span>
            </div>
          )) || (
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-gray-100 rounded-md"></div>
              <span className="underline">Choisir un passepoil</span>
            </div>
          )}
        </Listbox.Button>
        <Popover>
          <Popover.Button className="flex items-center p-2">
            <InformationCircleIcon className="w-8 h-8 text-primary-100" />
            <span className="sr-only">Ouvrir la popup d'explication de ce qu'est un passepoil</span>
          </Popover.Button>
          <Popover.Panel className="p-4 bg-white shadow-md z-10 !outline-none border absolute right-0 w-screen max-w-sm">
            <h3 className="mb-4 font-serif text-xl">C'est quoi un passepoil ?</h3>
            <p className="mb-2">C'est un liserai décoratif entre deux tissus.</p>
            <p>Il n'est pour l'instant pas possible de le visualiser sur l'aperçu 3D.</p>
          </Popover.Panel>
        </Popover>
      </div>
      {query.isPending && <p>Chargement...</p>}
      <Transition
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Listbox.Options
          ref={field.ref}
          onBlur={field.onBlur}
          as="ul"
          className={clsx(
            'absolute bg-white shadow-md p-4 z-10 !outline-none border',
            'grid grid-cols-[repeat(auto-fill,minmax(5rem,1fr))] gap-4',
            'w-screen max-w-sm max-h-96 overflow-y-auto'
          )}
        >
          {query.data?.map((piping) => (
            <Listbox.Option
              key={piping.id}
              value={piping.id}
              as="li"
              className="ui-selected:ring-2 ui-not-selected:ring-0 ring-primary-100 !outline-none"
            >
              <Image
                src={piping.image.url}
                width={80}
                height={80}
                alt={piping.name}
                loader={loader}
                placeholder={piping.image.placeholderDataUrl ? 'blur' : 'empty'}
                blurDataURL={piping.image.placeholderDataUrl ?? undefined}
              />
              <Listbox.Label className="text-center">{piping.name}</Listbox.Label>
            </Listbox.Option>
          ))}
        </Listbox.Options>
      </Transition>
    </Listbox>
  );
}
