'use client';

import { DecorativeDots } from '@couture-next/ui';
import { Disclosure, Transition } from '@headlessui/react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Faq as FaqType, fetchFromCMS } from 'apps/storefront/directus';
import { loader } from 'apps/storefront/utils/next-image-directus-loader';
import Image from 'next/image';
import { ChevronDownIcon } from '@heroicons/react/24/solid';

export function Faq() {
  const faqQuery = useSuspenseQuery({
    queryKey: ['cms', 'faq'],
    queryFn: () => fetchFromCMS<FaqType[]>('/faq', { fields: '*.*' }),
  });

  if (faqQuery.isError) throw faqQuery.error;

  return (
    <ul className="mt-8 space-y-4 mb-16">
      {faqQuery.data.map((faq) => (
        <li className="space-y-4 overflow-hidden relative" key={faq.question}>
          <Disclosure>
            <div className="flex justify-center items-center px-8 bg-light-100 ">
              <Disclosure.Button className="bg-light-100 py-4  w-full z-10 relative !outline-none">
                {faq.question}
              </Disclosure.Button>
              <ChevronDownIcon className="w-6 h-6 ml-4"></ChevronDownIcon>
            </div>
            <Transition
              className="relative transition-transform ease-out"
              enterFrom="-translate-y-full"
              enterTo="translate-y-0"
              leaveFrom="translate-y-0"
              leaveTo="-translate-y-full"
            >
              <>
                <Disclosure.Panel className="flex flex-col items-center gap-4 !outline-none max-w-prose mx-auto">
                  <div className="space-y-2">
                    {faq.answer.split('\n').map((txt, i) => (
                      <p key={i}>{txt}</p>
                    ))}
                  </div>
                  {faq.image && (
                    <div className="relative w-full h-64">
                      <Image
                        src={faq.image.filename_disk}
                        loader={loader}
                        fill
                        alt=""
                        className="object-contain"
                        sizes="(min-width: 650px) 650px, 100vw"
                      />
                    </div>
                  )}
                </Disclosure.Panel>
                <DecorativeDots className="absolute top-1/2 -translate-y-1/2 right-0 2xl:right-[10%] max-[1100px]:hidden" />
                <DecorativeDots className="absolute top-1/2 -translate-y-1/2 left-0 2xl:left-[10%] max-[1100px]:hidden" />
              </>
            </Transition>
          </Disclosure>
        </li>
      ))}
    </ul>
  );
}
