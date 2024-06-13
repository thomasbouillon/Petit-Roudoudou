'use client';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { PropsWithChildren } from 'react';

export default function HiddenLinks({ children }: PropsWithChildren) {
  return (
    <Disclosure>
      <DisclosureButton className="text-center underline table mx-auto my-4 group">
        <span className="group-data-[open]:hidden">Voir plus</span>
        <span className="group-data-[open]:block hidden">Voir moins</span>
      </DisclosureButton>
      <DisclosurePanel>{children}</DisclosurePanel>
    </Disclosure>
  );
}
