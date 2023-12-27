'use client';

import { Disclosure, Transition } from '@headlessui/react';
import clsx from 'clsx';
import type { Url } from 'next/dist/shared/lib/router/router';
import { ButtonHTMLAttributes, ComponentType, PropsWithChildren, useEffect } from 'react';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';

type NavItemLeafType = {
  label: string;
  href: string;
  items?: never;
  highlight?: boolean;
};

type NavItemGroupType = {
  label: string;
  items: NavItem[];
  href: string;
  highlight?: boolean;
};

export type NavItem = NavItemLeafType | NavItemGroupType;

export function Nav({
  items,
  className,
  subMenuClassName = '',
  Link,
  ...props
}: PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    Link: ComponentType<PropsWithChildren<{ href: Url; className?: string }>>;
    items: NavItem[];
    subMenuClassName?: string;
  }
>) {
  return (
    <nav className={className} {...props}>
      <ul className="flex flex-col pb-4">
        {items.map((item) => (
          <NavItem item={item} Link={Link} key={item.href} subMenuClassName={subMenuClassName} />
        ))}
      </ul>
    </nav>
  );
}

function NavItem({
  item,
  Link,
  subMenuClassName,
}: {
  item: NavItem;
  Link: ComponentType<PropsWithChildren<{ href: Url; className?: string }>>;
  subMenuClassName: string;
}) {
  return (
    <li className="mx-2 border-b border-gray-300 first:group last:border-b-0" key={item.href}>
      {item.items === undefined && (
        <Link href={item.href} className={clsx('block py-4', item.highlight && 'text-primary-100')}>
          {item.label}
        </Link>
      )}
      {!!item.items && (
        <Disclosure>
          <Disclosure.Button className={clsx('block w-full text-start py-4', item.highlight && 'text-primary-100')}>
            {item.label}
          </Disclosure.Button>
          <Transition
            className={clsx('transition-transform transform-gpu duration-500 ease-in-out', subMenuClassName)}
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <Disclosure.Panel>
              {({ close }) => (
                <ul className={clsx('flex flex-col')}>
                  <li className="md:hidden">
                    <button onClick={() => close()} className="flex items-center">
                      <ChevronLeftIcon className="w-6 h-6 -ml-2" />
                      Retourner au menu
                    </button>
                  </li>
                  <li className="mt-2">
                    <Link className="mt-4 py-2 block text-center underline underline-offset-2" href={item.href}>
                      {item.label}
                    </Link>
                  </li>
                  {item.items &&
                    item.items.map((subItem, i) => (
                      <NavItem key={subItem.href} item={subItem} Link={Link} subMenuClassName={subMenuClassName} />
                    ))}
                </ul>
              )}
            </Disclosure.Panel>
          </Transition>
        </Disclosure>
      )}
    </li>
  );
}
