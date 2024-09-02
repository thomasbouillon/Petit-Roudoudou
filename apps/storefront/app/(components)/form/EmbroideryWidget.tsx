import clsx from 'clsx';
import EmbroideryColorFieldWidget from './EmbroideryColorWidget';
import { useController } from 'react-hook-form';
import { Popover, PopoverButton, PopoverPanel, Transition } from '@headlessui/react';
import { InformationCircleIcon } from '@heroicons/react/24/solid';
import { StorageImage } from '../../StorageImage';
import Link from 'next/link';

export default function EmbroideryWidget({
  inputClassName,
  customizableUid,
  layout = 'horizontal',
}: {
  customizableUid: string;
  inputClassName?: string;
  layout?: 'horizontal' | 'vertical';
}) {
  return (
    <div className={clsx('grid relative', layout === 'horizontal' && 'sm:grid-cols-2 sm:gap-2')}>
      <EmbroideryHelpPopup className="absolute right-0 -translate-y-6" />
      <div className="h-full flex flex-col">
        <small className="block">Prénom, Petit mot, Surnom</small>
        <EmbroideryTextFieldWidget customizableUid={customizableUid} inputClassName={inputClassName} />
      </div>
      <div>
        <small className="block">Couleur</small>
        <div className={inputClassName}>
          <EmbroideryColorFieldWidget customizableUid={customizableUid} />
        </div>
      </div>
    </div>
  );
}

function EmbroideryTextFieldWidget({
  customizableUid,
  inputClassName,
  disabled,
}: {
  customizableUid: string;
  inputClassName?: string;
  disabled?: boolean;
}) {
  const { field } = useController({ name: `customizations.${customizableUid}.text` });

  return (
    <input
      className={clsx(inputClassName, 'flex-grow')}
      value={field.value ?? ''}
      onChange={(e) => field.onChange(e.target.value)}
      disabled={disabled}
    />
  );
}

function EmbroideryHelpPopup({ className }: { className?: string }) {
  return (
    <Popover className={className}>
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
        <PopoverPanel anchor="bottom end" className="p-4 bg-white shadow-md z-10 !outline-none border space-y-2 w-80">
          <h3 className="mb-4 font-serif text-xl">A quoi ressemble la broderie ?</h3>
          <p>La broderie n'est pas visible sur l'aperçu du site.</p>
          <p>Voici un exemple pour le prénom "Mathilde" brodée couleur or pailleté.</p>
          <StorageImage
            src="public/images/embroidery-example.png"
            alt="Exemple de broderie"
            width={320}
            height={150}
            className="mx-auto"
          />
          <p>Retrouve plus d'exemples sur mon compte Instagram</p>
        </PopoverPanel>
      </Transition>
    </Popover>
  );
}
