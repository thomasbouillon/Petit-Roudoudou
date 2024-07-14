import { Label, Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from '@headlessui/react';
import { useController, useWatch } from 'react-hook-form';
import React, { useMemo } from 'react';
import { trpc } from 'apps/storefront/trpc-client';
import clsx from 'clsx';
import Image from 'next/image';
import { loader } from 'apps/storefront/utils/next-image-firebase-storage-loader';

function useColorWidgetDisabled(customizableUid: string) {
  const textValue = useWatch({ name: `customizations.${customizableUid}.text` });
  return useMemo(() => !textValue, [textValue]);
}

export default function EmbroideryColorFieldWidget({
  customizableUid,
  buttonClassName,
}: {
  customizableUid: string;
  buttonClassName?: string;
}) {
  const disabled = useColorWidgetDisabled(customizableUid);
  const {
    field,
    fieldState: { error },
  } = useController({
    name: `customizations.${customizableUid}.colorId`,
    rules: {
      required: !disabled,
    },
  });

  const query = trpc.embroideryColors.list.useQuery();
  if (query.error) throw query.error;

  const selectedEmbroideryColor = useMemo(
    () => query.data?.find((embroideryColor) => embroideryColor.id === field.value),
    [field.value, query.data]
  );

  return (
    <Listbox value={field.value} onChange={(value) => field.onChange(value)} disabled={disabled}>
      <div className={clsx('flex items-center', buttonClassName)}>
        <ListboxButton className={clsx('!outline-none grow', disabled && 'opacity-50 cursor-not-allowed')}>
          {(selectedEmbroideryColor && (
            <div className="flex items-center gap-6">
              <Image
                src={selectedEmbroideryColor.image.url}
                width={32}
                height={32}
                alt={selectedEmbroideryColor.name}
                loader={loader}
              />
              <span className="underline">Changer la couleur du fil</span>
            </div>
          )) || (
            <div className="flex items-center gap-6">
              <div className="w-8 h-8 bg-gray-100 rounded-md"></div>
              <span className="underline">Choisir une couleur pour le fil</span>
            </div>
          )}
        </ListboxButton>
        {!!error?.message && <span className="text-red-500 text-sm">{error.message}</span>}
      </div>
      {query.isPending && <p>Chargement...</p>}
      <ListboxOptions
        modal={false}
        ref={field.ref}
        onBlur={field.onBlur}
        anchor="bottom"
        as="ul"
        className={clsx(
          'bg-white shadow-md p-4 z-10 !outline-none border',
          'grid grid-cols-[repeat(auto-fill,minmax(5rem,1fr))] gap-4',
          'w-screen !max-w-sm max-h-96 [--anchor-max-height:384px]',
          'transition-[transform,opacity] ease-in-out duration-100  data-[closed]:scale-95 data-[closed]:opacity-0'
        )}
      >
        {query.data?.map((embroideryColor) => (
          <ListboxOption
            key={embroideryColor.id}
            value={embroideryColor.id}
            as="li"
            className="data-[selected]:ring-2 ring-primary-100 !outline-none"
          >
            <Image
              src={embroideryColor.image.url}
              width={80}
              height={80}
              alt={embroideryColor.name}
              loader={loader}
              placeholder={embroideryColor.image.placeholderDataUrl ? 'blur' : 'empty'}
              blurDataURL={embroideryColor.image.placeholderDataUrl ?? undefined}
            />
            <Label className="text-center">{embroideryColor.name}</Label>
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  );
}
