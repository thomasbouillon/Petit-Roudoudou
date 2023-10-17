import { Disclosure, Transition } from '@headlessui/react';
import { ArrowsPointingOutIcon } from '@heroicons/react/24/solid';
import clsx from 'clsx';
import React, { PropsWithChildren } from 'react';
import { ReactComponent as RandomIcon } from '../../../assets/random.svg';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

type Props = {
  className?: string;
};

export default function ChooseOptions({ className }: Props) {
  return (
    <div className={className}>
      <h2 className="font-serif text-2xl mb-8 px-4">
        2. Je personnalise ma couverture
      </h2>
      <div className="relative">
        {/* canvas */}
        <div className="absolute top-4 right-4">
          <button
            type="button"
            aria-hidden
            className="border-primary-100 border-2 px-4 py-2"
            onClick={() => alert('Coming soon !')}
          >
            <ArrowsPointingOutIcon className="w-6 h-6 text-primary-100" />
          </button>
          <button
            type="button"
            aria-hidden
            className="border-primary-100 border-2 px-4 py-2 block mt-4"
            onClick={() => alert('Coming soon !')}
          >
            <RandomIcon className="w-6 h-6 text-primary-100" />
          </button>
        </div>
        <div className="w-[400px] h-[600px] bg-light-100 mx-auto"></div>
      </div>
      <button
        className="btn-light ml-auto px-4"
        type="button"
        onClick={() => alert('Coming soon !')}
      >
        Comment ca marche ?
      </button>
      <div className="border-t" aria-hidden></div>
      <Option title="Tissu Minky">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(4rem,1fr))] gap-2">
          <div className="aspect-square w-full bg-light-100"></div>
          <div className="aspect-square w-full bg-light-100"></div>
          <div className="aspect-square w-full bg-light-100"></div>
          <div className="aspect-square w-full bg-light-100"></div>
          <div className="aspect-square w-full bg-light-100"></div>
          <div className="aspect-square w-full bg-light-100"></div>
          <div className="aspect-square w-full bg-light-100"></div>
          <div className="aspect-square w-full bg-light-100"></div>
          <div className="aspect-square w-full bg-light-100"></div>
          <div className="aspect-square w-full bg-light-100"></div>
          <div className="aspect-square w-full bg-light-100"></div>
          <div className="aspect-square w-full bg-light-100"></div>
          <div className="aspect-square w-full bg-light-100"></div>
          <div className="aspect-square w-full bg-light-100"></div>
        </div>
      </Option>
      <Option title="Tissu Coton">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(4rem,1fr))] gap-2">
          <div className="aspect-square w-full bg-light-100"></div>
          <div className="aspect-square w-full bg-light-100"></div>
          <div className="aspect-square w-full bg-light-100"></div>
        </div>
      </Option>
      <button type="submit" className="btn-primary mx-auto mt-8">
        Finaliser
      </button>
    </div>
  );
}

const Option: React.FC<PropsWithChildren<{ title: string }>> = ({
  title,
  children,
}) => (
  <div className="border-b">
    <Disclosure>
      {({ open }) => (
        <>
          <Disclosure.Button className="flex justify-between w-full p-4 items-center">
            <span>{title}</span>
            <ChevronDownIcon
              className={clsx(
                'w-8 h-8 text-primary-100 transition-transform',
                open && 'rotate-180'
              )}
            />
          </Disclosure.Button>
          <Transition
            enter="transition duration-100 ease-out"
            enterFrom="transform scale-95 opacity-0"
            enterTo="transform scale-100 opacity-100"
            leave="transition duration-75 ease-out"
            leaveFrom="transform scale-100 opacity-100"
            leaveTo="transform scale-95 opacity-0"
          >
            <Disclosure.Panel className="p-4 pt-0">{children}</Disclosure.Panel>
          </Transition>
        </>
      )}
    </Disclosure>
  </div>
);
