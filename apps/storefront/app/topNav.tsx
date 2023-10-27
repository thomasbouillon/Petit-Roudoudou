'use client';

import { ReactComponent as FacebookIcon } from '../assets/facebook.svg';
import { ReactComponent as InstagramIcon } from '../assets/instagram.svg';
import { ReactComponent as TikTokIcon } from '../assets/tiktok.svg';
import { useCallback, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { Menu, Transition } from '@headlessui/react';
import { Nav, Spinner } from '@couture-next/ui';
import Link from 'next/link';
import useBlockBodyScroll from '../hooks/useBlockBodyScroll';
import useIsMobile from '../hooks/useIsMobile';
import { usePathname } from 'next/navigation';
import type { NavItem } from '@couture-next/ui';
import { useAuth } from '../contexts/AuthContext';
import { CartPreview } from './cartPreview';
import { UserCircleIcon } from '@heroicons/react/24/solid';

const publicNavRoutes: NavItem[] = [
  {
    label: 'Accueil',
    href: '/',
  },
  {
    label: 'La boutique',
    href: '/boutique',
    items: [
      {
        label: 'La chambre',
        href: '/boutique',
        items: [
          { label: 'Tour de lit', href: '/boutique' },
          { label: 'Gigoteuse', href: '/boutique' },
        ],
      },
      {
        label: 'La salle de bain',
        href: '/boutique',
      },
    ],
  },
  {
    label: 'Les tissus',
    href: '/tissus',
    items: [
      {
        label: 'Les minkys',
        href: '/tissus/minkys',
        items: [
          { label: 'Rouge', href: '/tissus/minkys/rouge' },
          { label: 'Rose', href: '/tissus/minkys/rose' },
        ],
      },
      { label: 'Les satins', href: '/tissus/satins' },
    ],
  },
  {
    label: 'Evènements',
    href: '/evenements',
  },
  {
    label: 'Nos partenaires',
    href: '/partenaires',
  },
];

export default function TopNav() {
  const [expanded, setExpanded] = useState(false);
  const blockBodyScroll = useBlockBodyScroll();
  const isMobile = useIsMobile();

  const { user, auth, isAdmin, fetchingUser } = useAuth();

  const logout = useCallback(() => {
    if (auth.currentUser) {
      auth.signOut();
    }
  }, [auth]);

  useEffect(() => {
    if (!isMobile) blockBodyScroll(false);
    else blockBodyScroll(expanded);
  }, [expanded, blockBodyScroll, isMobile]);

  const currentRoute = usePathname();
  useEffect(() => {
    setExpanded(false);
  }, [currentRoute, setExpanded]);

  const navRoutes = useMemo(
    () =>
      isAdmin
        ? [
            {
              label: 'Administration',
              href: '/admin',
              highlight: true,
            },
            ...publicNavRoutes,
          ]
        : publicNavRoutes,
    [isAdmin]
  );

  return (
    <>
      <div className="h-[3.5rem] grid grid-cols-[auto,1fr] sm:grid-cols-[1fr,auto,1fr] sticky top-0 bg-white z-[100] px-4 gap-4">
        <button
          className="w-14 h-14 relative focus:outline-none text-primary-100"
          aria-controls="nav-bar"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
        >
          <span className="sr-only">
            {expanded ? 'Fermer le menu' : 'Ouvrir le menu'}
          </span>
          <Hamburger expanded={expanded} />
        </button>
        <div className="flex gap-4 items-center sr-only sm:not-sr-only">
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
            className=""
          >
            <span className="sr-only">Facebook [nouvel onglet]</span>
            <FacebookIcon className="w-8 h-8" aria-hidden />
          </Link>
        </div>
        <div className="flex items-center justify-end gap-4">
          {fetchingUser && <Spinner className="w-8 h-8  text-primary-100" />}
          {!fetchingUser && !user && (
            <Link href="/connexion" className="text-primary-100">
              <span className="hidden sm:block">Connexion</span>
              <UserCircleIcon className="sm:hidden w-8 h-8 scale-125" />
            </Link>
          )}
          {!fetchingUser && !!user && (
            <Menu as="div" className="relative h-full text-primary-100">
              <Menu.Button className="h-full">
                <span className="sr-only sm:not-sr-only">Hello</span>{' '}
                {user.displayName}
              </Menu.Button>
              <Menu.Items className="absolute top-full bg-white rounded-sm shadow-md p-4 border">
                <Menu.Item as="button" onClick={logout}>
                  Déconnexion
                </Menu.Item>
              </Menu.Items>
            </Menu>
          )}
          <CartPreview />
        </div>
      </div>
      <div id="nav-bar">
        <Transition
          show={expanded}
          className={clsx(
            'transition duration-300 md:duration-200 ease-in-out',
            'fixed top-[3.5rem] left-0 w-screen h-[calc(100dvh-3.5rem)] z-[98]',
            'transform-gpu'
          )}
          enterFrom="max-md:-translate-x-full md:-translate-y-full"
          enterTo="max-md:translate-x-0 md:translate-y-0"
          leaveFrom="max-md:translate-x-0 md:translate-y-0"
          leaveTo="max-md:-translate-x-full md:-translate-y-full"
        >
          <Nav
            className="bg-white px-4 pt-8 w-full h-full md:h-auto overflow-y-auto shadow-sm"
            subMenuClassName={clsx(
              'bg-white fixed top-0 left-0 w-screen h-[calc(100dvh-3.5rem)] z-[99] px-4 py-8'
            )}
            items={navRoutes}
            Link={Link}
          />
        </Transition>
      </div>
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
