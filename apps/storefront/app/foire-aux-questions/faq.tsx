'use client';

import { Disclosure, Transition } from '@headlessui/react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Faq, fetchFromCMS } from 'apps/storefront/directus';
import { loader } from 'apps/storefront/utils/next-image-directus-loader';
import Image from 'next/image';

export function Faq() {
  const faqQuery = useSuspenseQuery({
    queryKey: ['cms', 'faq'],
    queryFn: () => fetchFromCMS<Faq[]>('/faq', { fields: '*.*' }),
  });

  if (faqQuery.isError) throw faqQuery.error;

  return (
    <ul className="mt-8 space-y-4 mb-16">
      {faqQuery.data.map((faq) => (
        <li className="space-y-4 overflow-hidden relative" key={faq.question}>
          <Disclosure>
            <Disclosure.Button className="bg-light-100 px-8 py-4 w-full z-10 relative !outline-none">
              {faq.question}
            </Disclosure.Button>
            <Transition
              className="transition-transform ease-out"
              enterFrom="-translate-y-full"
              enterTo="translate-y-0"
              leaveFrom="translate-y-0"
              leaveTo="-translate-y-full"
            >
              <Disclosure.Panel className="flex flex-col items-center gap-4 !outline-none">
                {faq.image && (
                  <Image
                    src={faq.image.filename_disk}
                    loader={loader}
                    width={256}
                    height={256}
                    alt=""
                    className="w-64 h-64 object-contain"
                  />
                )}
                <div className="space-y-2">
                  {faq.answer.split('\n').map((txt, i) => (
                    <p key={i}>{txt}</p>
                  ))}
                </div>
              </Disclosure.Panel>
            </Transition>
          </Disclosure>
        </li>
      ))}
    </ul>
  );
}
