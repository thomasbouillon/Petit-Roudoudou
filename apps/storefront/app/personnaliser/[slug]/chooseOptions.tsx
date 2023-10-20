import { Disclosure, Transition } from '@headlessui/react';
import { ArrowsPointingOutIcon } from '@heroicons/react/24/solid';
import clsx from 'clsx';
import React, { PropsWithChildren, Suspense, useCallback } from 'react';
import { ReactComponent as RandomIcon } from '../../../assets/random.svg';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import useFabricsFromGroups from '../../../hooks/useFabricsFromGroups';
import { Article } from '@couture-next/types';
import Image from 'next/image';
import Article3DScene from './article3DScene';
import { Spinner } from '@couture-next/ui';

type Props = {
  className?: string;
  article: Article;
};

export default function ChooseOptions({ className, article }: Props) {
  const [customizations, setCustomizations] = React.useState<
    Record<string, string>
  >({});

  const handleCustomization = useCallback(
    (partId: string, fabricId: string) => {
      setCustomizations((prev) => ({
        ...prev,
        [partId]: fabricId,
      }));
    },
    [setCustomizations]
  );

  const getFabricsByGroupsQuery = useFabricsFromGroups(
    article.customizables.flatMap((customizable) => customizable.fabricListId)
  );
  if (getFabricsByGroupsQuery.isError) throw getFabricsByGroupsQuery.error;
  if (getFabricsByGroupsQuery.isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className={className}>
      <h2 className="font-serif text-2xl mb-8 px-4">
        2. Je personnalise ma couverture
      </h2>
      <div className="relative">
        <div className="h-[min(600px,60dvh)] bg-light-100 mx-auto">
          <Article3DScene
            article={article}
            getFabricsByGroupsQuery={getFabricsByGroupsQuery}
            customizations={customizations}
          />
        </div>
        <div className="absolute top-4 right-4">
          <button
            type="button"
            aria-hidden
            className="border-primary-100 border-2 px-4 py-2 bg-light-100"
            onClick={() => alert('Coming soon !')}
          >
            <ArrowsPointingOutIcon className="w-6 h-6 text-primary-100" />
          </button>
          <button
            type="button"
            aria-hidden
            className="border-primary-100 border-2 px-4 py-2 block mt-4 bg-light-100"
            onClick={() => alert('Coming soon !')}
          >
            <RandomIcon className="w-6 h-6 text-primary-100" />
          </button>
        </div>
      </div>
      <button
        className="btn-light ml-auto px-4"
        type="button"
        onClick={() => alert('Coming soon !')}
      >
        Comment ca marche ?
      </button>
      <div className="border-t" aria-hidden></div>
      {article.customizables.map((customizable) => (
        <Option title={customizable.label} key={customizable.treeJsModelPartId}>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(4rem,1fr))] gap-2">
            {getFabricsByGroupsQuery.data[customizable.fabricListId].map(
              (fabric) => (
                <Image
                  className={clsx(
                    'w-16 h-16',
                    customizations[customizable.treeJsModelPartId] ===
                      fabric._id &&
                      'ring-2 ring-primary-100 object-cover object-center'
                  )}
                  alt=""
                  key={fabric._id}
                  src={fabric.image.url}
                  width={64}
                  height={64}
                  onClick={() =>
                    handleCustomization(
                      customizable.treeJsModelPartId,
                      fabric._id
                    )
                  }
                />
              )
            )}
          </div>
        </Option>
      ))}
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
