import { CloseButton, Dialog, DialogPanel, DialogTitle, Field, Label, Radio, RadioGroup } from '@headlessui/react';
import { useController, useWatch } from 'react-hook-form';
import React, { useMemo, useState } from 'react';
import { trpc } from 'apps/storefront/trpc-client';
import clsx from 'clsx';
import Image from 'next/image';
import { loader } from 'apps/storefront/utils/next-image-firebase-storage-loader';
import { XMarkIcon } from '@heroicons/react/24/solid';

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

  const [open, setOpen] = useState(false);

  return (
    <div>
      <div className={clsx('flex', buttonClassName)}>
        <button
          type="button"
          className={clsx(disabled && 'opacity-50 cursor-not-allowed')}
          disabled={disabled}
          onClick={() => setOpen(true)}
        >
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
        </button>
      </div>
      {!!error?.message && <span className="text-red-500 text-sm block">{error.message}</span>}
      {query.isPending && <p>Chargement...</p>}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        as="div"
        transition
        className={clsx(
          'fixed left-0 top-0 w-screen h-[100dvh] z-[100] overflow-y-auto overflow-x-hidden',
          'transition-[transform,opacity] ease-in-out duration-300  data-[closed]:scale-95 data-[closed]:opacity-0'
        )}
      >
        <DialogPanel className="relative min-h-screen bg-white py-8 space-y-6">
          <DialogTitle as="h3" className="text-xl text-center">
            Choisir une couleur pour le fil
          </DialogTitle>
          <CloseButton className="fixed right-2 top-2 !mt-0">
            <span className="sr-only">Fermer</span>
            <XMarkIcon className="w-6 h-6" />
          </CloseButton>
          <RadioGroup
            value={field.value}
            onChange={field.onChange}
            className="grid grid-cols-[repeat(auto-fit,5rem)] gap-4 px-4 place-content-center max-w-3xl sm:mx-auto"
          >
            {query.data?.map((embroideryColor) => (
              <Field key={embroideryColor.id}>
                <Radio
                  key={embroideryColor.id}
                  value={embroideryColor.id}
                  className="group !outline-none cursor-pointer"
                >
                  <Image
                    src={embroideryColor.image.url}
                    width={80}
                    height={80}
                    alt={embroideryColor.name}
                    loader={loader}
                    placeholder={embroideryColor.image.placeholderDataUrl ? 'blur' : 'empty'}
                    blurDataURL={embroideryColor.image.placeholderDataUrl ?? undefined}
                    className="object-contain object-center w-full h-20 mx-auto group-data-[checked]:ring-2 ring-primary-100"
                  />
                  <Label className="text-center block group-data-[checked]:text-primary-100">
                    {embroideryColor.name}
                  </Label>
                </Radio>
              </Field>
            ))}
          </RadioGroup>
          <CloseButton className={clsx('fixed left-0 bottom-0 !mt-0 btn-primary w-full', !field.value && 'hidden')}>
            Continuer
          </CloseButton>
        </DialogPanel>
      </Dialog>
    </div>
  );
}
