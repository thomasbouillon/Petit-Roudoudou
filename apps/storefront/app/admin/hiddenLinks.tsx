'use client';
import { Disclosure } from '@headlessui/react';
import { PropsWithChildren } from 'react';

export default function HiddenLinks({ children }: PropsWithChildren) {
  return (
    <Disclosure>
      <Disclosure.Button className="text-center underline table mx-auto my-4">
        <span className="ui-open:hidden">Voir plus</span>
        <span className="ui-not-open:hidden">Voir moins</span>
      </Disclosure.Button>
      <Disclosure.Panel>{children}</Disclosure.Panel>
    </Disclosure>
  );
}
