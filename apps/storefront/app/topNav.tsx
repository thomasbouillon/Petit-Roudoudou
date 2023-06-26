'use client';

import { ReactComponent as FacebookIcon } from '../assets/facebook.svg';
import { ReactComponent as InstagramIcon } from '../assets/instagram.svg';
import { ReactComponent as TikTokIcon } from '../assets/tiktok.svg';
import { ReactComponent as CartIcon } from '../assets/cart.svg';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Transition } from '@headlessui/react';
import { Nav } from '@couture-next/ui';
import Link from 'next/link';
import useBlockBodyScroll from '../hooks/useBlockBodyScroll';
import useIsMobile from '../hooks/useIsMobile';

export default function TopNav() {
  const [expanded, setExpanded] = useState(false);
  const blockBodyScroll = useBlockBodyScroll();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isMobile) blockBodyScroll(false);
    else blockBodyScroll(expanded);
  }, [expanded, blockBodyScroll, isMobile]);

  return (
    <>
      <div className="h-[3.5rem] flex justify-between sticky top-0 bg-white z-[100] px-4">
        <button
          className="w-14 h-14 relative focus:outline-none text-primary-100"
          aria-controls="nav-bar"
          onClick={() => setExpanded(!expanded)}
        >
          <span className="sr-only">
            {expanded ? 'Fermer le menu' : 'Ouvrir le menu'}
          </span>
          <Hamburger expanded={expanded} />
        </button>
        <div className="flex gap-4 items-center">
          <Link href="https://www.tiktok.com/@petit_roudoudou" target="_blank">
            <span className="sr-only">TikTok [nouvel onglet]</span>
            <TikTokIcon className="w-8 h-8" aria-hidden />
          </Link>
          <Link href="https://instagram.com/petit_roudoudou" target="_blank">
            <span className="sr-only">Instagram [nouvel onglet]</span>
            <InstagramIcon className="w-8 h-8" aria-hidden />
          </Link>
          <Link
            href="https://www.facebook.com/ptitroudoudoucreatrice"
            target="_blank"
          >
            <span className="sr-only">Facebook [nouvel onglet]</span>
            <FacebookIcon className="w-8 h-8" aria-hidden />
          </Link>
        </div>
        <div className="flex items-center">
          <CartIcon className="w-8 h-8" />
        </div>
      </div>
      <Transition
        show={expanded}
        className={clsx(
          'transition duration-300 md:duration-200 ease-in-out',
          'fixed top-[3.5rem] left-0 w-screen h-[calc(100dvh-3.5rem)] z-[99]',
          'transform-gpu'
        )}
        enterFrom="max-md:-translate-x-full md:-translate-y-full"
        enterTo="max-md:translate-x-0 md:translate-y-0"
        leaveFrom="max-md:translate-x-0 md:translate-y-0"
        leaveTo="max-md:-translate-x-full md:-translate-y-full"
      >
        <Nav
          className="bg-white px-4 pt-8 w-full h-full md:h-auto overflow-y-auto"
          items={[
            { label: 'Femmes', href: '/femmes' },
            { label: 'Hommes', href: '/hommes' },
          ]}
          renderLink={(href, label) => <Link href={href}>{label}</Link>}
        />
      </Transition>
    </>
  );
}

function Hamburger({ expanded }: { expanded: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="block w-9 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
    >
      <span
        className={clsx(
          'block absolute h-0.5 w-9 bg-current transform-gpu transition duration-500 ease-in-out',
          expanded && 'rotate-45',
          !expanded && '-translate-y-3'
        )}
      ></span>
      <span
        className={clsx(
          'block absolute h-0.5 w-9 bg-current transform-gpu transition duration-500 ease-in-out',
          expanded && 'opacity-0'
        )}
      ></span>
      <span
        className={clsx(
          'block absolute h-0.5 w-9 bg-current transform-gpu transition duration-500 ease-in-out',
          expanded && '-rotate-45',
          !expanded && 'translate-y-3'
        )}
      ></span>
    </div>
  );
}
