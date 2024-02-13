'use client';

import { ReactComponent as FacebookIcon } from '../assets/facebook.svg';
import { ReactComponent as InstagramIcon } from '../assets/instagram.svg';
import { ReactComponent as TikTokIcon } from '../assets/tiktok.svg';
import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { Menu, Transition } from '@headlessui/react';
import { Nav, Spinner } from '@couture-next/ui';
import Link from 'next/link';
import { useBlockBodyScroll } from '../contexts/BlockBodyScrollContext';
import useIsMobile from '../hooks/useIsMobile';
import { usePathname } from 'next/navigation';
import type { NavItem } from '@couture-next/ui';
import { useAuth } from '../contexts/AuthContext';
import { CartPreview } from './cartPreview';
import { UserCircleIcon } from '@heroicons/react/24/solid';
import { routes } from '@couture-next/routing';
import { Article } from '@couture-next/types';
import { collection, getDocs } from 'firebase/firestore';
import { firestoreConverterAddRemoveId } from '@couture-next/utils';
import useDatabase from '../hooks/useDatabase';
import { useQuery } from '@tanstack/react-query';

const getPublicNavRoutes = (articles: Article[], isAdmin: boolean): NavItem[] => [
  ...(isAdmin
    ? [
        {
          label: 'Administration',
          href: routes().admin().index(),
          highlight: true,
        } satisfies NavItem,
      ]
    : []),
  {
    label: 'Accueil',
    href: routes().index(),
  },
  {
    label: 'La boutique',
    href: routes().shop().index(),
    items: articles.map((article) => ({
      label: article.namePlural,
      href: routes().shop().article(article.slug).index(),
    })),
  },
  {
    label: 'Les tissus',
    href: routes().fabrics().index(),
  },
  {
    label: 'Evènements',
    href: routes().events().index(),
  },
  {
    label: 'Nos partenaires',
    href: routes().partners().index(),
  },
  {
    label: 'Foire aux questions',
    href: routes().faq().index(),
  },
];

export default function TopNav() {
  const [expanded, setExpanded] = useState(false);
  const blockBodyScroll = useBlockBodyScroll();
  const isMobile = useIsMobile(true);

  const { userQuery, logoutMutation, isAdminQuery } = useAuth();

  const db = useDatabase();
  const allArticlesQuery = useQuery({
    queryKey: ['articles'],
    queryFn: () =>
      getDocs(collection(db, 'articles').withConverter(firestoreConverterAddRemoveId<Article>())).then((snapshot) =>
        snapshot.docs.map((doc) => doc.data())
      ),
  });

  useEffect(() => {
    if (!isMobile) blockBodyScroll(false);
    else blockBodyScroll(expanded);
  }, [expanded, blockBodyScroll, isMobile]);

  const currentRoute = usePathname();
  useEffect(() => {
    setExpanded(false);
  }, [currentRoute, setExpanded]);

  const navRoutes = useMemo(
    () => getPublicNavRoutes(allArticlesQuery.data ?? [], isAdminQuery.data || false),
    [isAdminQuery.data, allArticlesQuery.data]
  );

  return (
    <>
      <div className="h-[3.5rem] grid grid-cols-[auto,1fr] sm:grid-cols-[1fr,auto,1fr] sticky top-0 bg-white z-[100] px-4 gap-4 print:hidden">
        <button
          className="w-14 h-14 relative text-primary-100"
          aria-controls="nav-bar"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          id="topNav_toggle-nav-button"
        >
          <span className="sr-only">{expanded ? 'Fermer le menu' : 'Ouvrir le menu'}</span>
          <Hamburger expanded={expanded} />
        </button>
        <div className="flex gap-4 items-center sr-only sm:not-sr-only">
          <Link href="https://www.tiktok.com/@petit_roudoudou" target="_blank" id="topNav_tiktok-button">
            <span className="sr-only">TikTok [nouvel onglet]</span>
            <TikTokIcon className="w-8 h-8" aria-hidden />
          </Link>
          <Link href="https://instagram.com/petit_roudoudou" target="_blank" id="topNav_instagram-button">
            <span className="sr-only">Instagram [nouvel onglet]</span>
            <InstagramIcon className="w-8 h-8" aria-hidden />
          </Link>
          <Link
            href="https://www.facebook.com/ptitroudoudoucreatrice"
            target="_blank"
            className=""
            id="topNav_facebook-button"
          >
            <span className="sr-only">Facebook [nouvel onglet]</span>
            <FacebookIcon className="w-8 h-8" aria-hidden />
          </Link>
        </div>
        <div className="flex items-center justify-end gap-4">
          {userQuery.isLoading && <Spinner className="w-8 h-8  text-primary-100" />}
          {!userQuery.isLoading && (!userQuery.data || userQuery.data.isAnonymous) && (
            <Link
              href={routes().auth().login()}
              id="topNav_login-button"
              className="text-primary-100"
              aria-label="Connexion"
            >
              <span className="hidden sm:block" aria-hidden>
                Connexion
              </span>
              <UserCircleIcon className="sm:hidden w-8 h-8 scale-125" />
            </Link>
          )}
          {!userQuery.isLoading && userQuery.data?.isAnonymous === false && (
            <Menu as="div" className="relative h-full text-primary-100">
              <Menu.Button className="h-full" id="topNav_my-account-toggle-button">
                {!!userQuery.data.displayName ? (
                  <span data-posthog-recording-masked>{userQuery.data.displayName}</span>
                ) : (
                  <>
                    <UserCircleIcon className="w-8 h-8" />
                    <span className="sr-only">Mon compte</span>
                  </>
                )}
              </Menu.Button>
              <Menu.Items className="absolute top-full right-0 bg-white rounded-sm shadow-md p-4 border space-y-2">
                <Menu.Item as={Link} href={routes().account().index()} id="topNav_my-account-button">
                  Mon compte
                </Menu.Item>
                <Menu.Item as="button" onClick={() => logoutMutation.mutateAsync()} id="topNav_logout-button">
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
          <div className="absolute inset-0 z-98" onClick={() => setExpanded(!expanded)}></div>
          <Nav
            className="bg-white px-4 pt-8 w-full h-full md:h-auto overflow-y-auto shadow-sm relative"
            subMenuClassName={clsx('bg-white fixed top-0 left-0 w-screen h-[calc(100dvh-3.5rem)] z-[99] px-4 py-8')}
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
    <div aria-hidden="true" className="block w-9 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
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
