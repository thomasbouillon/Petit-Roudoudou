import {
  Label,
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from '@headlessui/react';
import { useController } from 'react-hook-form';
import React, { useMemo } from 'react';
import { trpc } from 'apps/storefront/trpc-client';
import clsx from 'clsx';
import Image from 'next/image';
import { loader } from 'apps/storefront/utils/next-image-firebase-storage-loader';
import { InformationCircleIcon } from '@heroicons/react/24/solid';

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

  return (
    <Listbox value={field.value} onChange={(value) => field.onChange(value)}>
      <div className={clsx('flex items-center mb-6 focus-within:outline outline-primary-100', buttonClassName)}>
        <ListboxButton className="grow !outline-none " ref={field.ref} onBlur={field.onBlur}>
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
        </ListboxButton>
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
      <ListboxOptions
        modal={false}
        ref={field.ref}
        onBlur={field.onBlur}
        anchor="bottom"
        as="ul"
        transition
        className={clsx(
          'bg-white shadow-md p-4 !outline-none border',
          'grid grid-cols-[repeat(auto-fill,minmax(5rem,1fr))] gap-4',
          'w-screen !max-w-sm max-h-96 [--anchor-max-height:384px]',
          'transition-[transform,opacity] ease-in-out duration-100  data-[closed]:scale-95 data-[closed]:opacity-0'
        )}
      >
        {query.data?.map((piping) => (
          <ListboxOption
            key={piping.id}
            value={piping.id}
            as="li"
            className="data-[selected]:ring-2 ring-primary-100 !outline-none"
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
            <Label className="text-center">{piping.name}</Label>
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  );
}
