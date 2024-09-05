import {
  CloseButton,
  Dialog,
  DialogPanel,
  DialogTitle,
  Field,
  Label,
  Popover,
  PopoverButton,
  PopoverPanel,
  Radio,
  RadioGroup,
  Transition,
} from '@headlessui/react';
import { useController } from 'react-hook-form';
import React, { useMemo, useState } from 'react';
import { trpc } from 'apps/storefront/trpc-client';
import clsx from 'clsx';
import Image from 'next/image';
import { loader } from 'apps/storefront/utils/next-image-firebase-storage-loader';
import { InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/solid';

export default function PipingWidget({
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

  const [open, setOpen] = useState(false);

  return (
    <div className="">
      <div className={clsx('flex justify-between', buttonClassName)}>
        <button type="button" onClick={() => setOpen(true)}>
          {(selectedPiping && (
            <div className="flex items-center gap-6">
              <Image src={selectedPiping.image.url} width={32} height={32} alt={selectedPiping.name} loader={loader} />
              <span className="underline">Changer le passepoil</span>
            </div>
          )) || (
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-gray-100 rounded-md"></div>
              <span className="underline">Choisir un passepoil</span>
            </div>
          )}
        </button>
        <Popover>
          <PopoverButton className="flex items-center p-2">
            <InformationCircleIcon className="w-8 h-8 text-primary-100" />
            <span className="sr-only">Ouvrir la popup d'explication de ce qu'est un passepoil</span>
          </PopoverButton>
          <Transition
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <PopoverPanel anchor="bottom end" className="p-4 bg-white shadow-md z-10 !outline-none border">
              <h3 className="mb-4 font-serif text-xl">C'est quoi un passepoil ?</h3>
              <p className="mb-2">C'est un liserai décoratif entre deux tissus.</p>
              <p>Il n'est pour l'instant pas possible de le visualiser sur l'aperçu 3D.</p>
            </PopoverPanel>
          </Transition>
        </Popover>
      </div>
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
            Choisir une couleur pour le passepoil
          </DialogTitle>
          <CloseButton className="fixed right-2 top-2 !mt-0">
            <span className="sr-only">Fermer</span>
            <XMarkIcon className="w-6 h-6" />
          </CloseButton>
          <RadioGroup
            value={field.value}
            onChange={field.onChange}
            className="grid grid-cols-[repeat(auto-fit,4rem)] gap-4 px-4 place-content-center max-w-3xl sm:mx-auto"
          >
            {query.data?.map((pipingColor) => (
              <Field key={pipingColor.id}>
                <Radio key={pipingColor.id} value={pipingColor.id} className="group !outline-none cursor-pointer">
                  <Image
                    src={pipingColor.image.url}
                    width={64}
                    height={64}
                    alt={pipingColor.name}
                    loader={loader}
                    placeholder={pipingColor.image.placeholderDataUrl ? 'blur' : 'empty'}
                    blurDataURL={pipingColor.image.placeholderDataUrl ?? undefined}
                    className="object-contain object-center w-full h-20 mx-auto group-data-[checked]:ring-2 ring-primary-100"
                  />
                  <Label className="text-center block group-data-[checked]:text-primary-100">{pipingColor.name}</Label>
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
