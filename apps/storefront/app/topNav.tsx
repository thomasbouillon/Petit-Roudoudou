'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
import { routes } from '@couture-next/routing';
import { Article } from '@couture-next/types';
import { SearchArticles } from './searchArticles';
import { MagnifyingGlassIcon, UserIcon } from '@heroicons/react/24/outline';
import { trpc } from '../trpc-client';
import { ArticleGroup } from '@prisma/client';
import { StorageImage } from './StorageImage';

const getShopRoutes = (articles: Article[], articleGroups: ArticleGroup[]): NavItem[] => {
  const articlesByGroups = articleGroups
    .map((group) => ({
      group,
      articles: articles.filter((article) => article.groupId === group.id),
    }))
    .filter(({ articles }) => articles.length > 0);
  const orphanArticles = articles.filter((article) => !article.groupId);
  return [
    ...articlesByGroups.map(({ group, articles }) => ({
      label: group.name,
      href: routes().shop().group(group.slug).index(),
      items: articles.map((article) => ({
        label: article.namePlural,
        href: routes().shop().article(article.slug).index(),
      })),
    })),
    ...orphanArticles.map((article) => ({
      label: article.namePlural,
      href: routes().shop().article(article.slug).index(),
    })),
  ];
};

const getPublicNavRoutes = (articles: Article[], articleGroups: ArticleGroup[], isAdmin: boolean): NavItem[] => [
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
    items: getShopRoutes(articles, articleGroups),
  },
  {
    label: 'Blog',
    href: routes().blog().index(),
  },
  {
    label: 'Evènements',
    href: routes().events().index(),
  },
  {
    label: 'Nos partenaires et récompenses',
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

  const { userQuery, logoutMutation, isAdmin } = useAuth();

  const allArticlesQuery = trpc.articles.list.useQuery(undefined, {
    select: (data) => data as Article[],
  });

  const allArticleGroupsQuery = trpc.articleGroups.list.useQuery();

  useEffect(() => {
    if (!isMobile) blockBodyScroll(false);
    else blockBodyScroll(expanded);
  }, [expanded, blockBodyScroll, isMobile]);

  const currentRoute = usePathname();
  useEffect(() => {
    setExpanded(false);
  }, [currentRoute, setExpanded]);

  const navRoutes = useMemo(
    () => getPublicNavRoutes(allArticlesQuery.data ?? [], allArticleGroupsQuery.data ?? [], isAdmin),
    [isAdmin, allArticlesQuery.data]
  );

  const searchArticlesPopoverButton = useRef<HTMLButtonElement>(null);

  return (
    <>
      <div className="h-[3.5rem] grid grid-cols-[1fr,auto,1fr] sticky top-0 bg-white z-[100] pl-4 pr-1 gap-4 print:hidden">
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
        <div className="flex items-center">
          <Link href={routes().index()}>
            <StorageImage
              src="public/images/nav-brand.png"
              width={171}
              height={40}
              className="object-contain object-center"
              alt="Logo Petit Roudoudou"
            />
          </Link>
        </div>
        <div className="flex items-center justify-end gap-4">
          <div className="hidden sm:block">
            <SearchArticles buttonRef={searchArticlesPopoverButton} />
          </div>

          {userQuery.isLoading && <Spinner className="w-8 h-8  text-primary-100" />}
          {!userQuery.isLoading && (!userQuery.data || userQuery.data.role === 'ANONYMOUS') && (
            <Link
              href={routes().auth().login()}
              id="topNav_login-button"
              className="text-primary-100"
              aria-label="Connexion"
            >
              <span className=" p-1 hidden sm:block" aria-hidden>
                Connexion
              </span>
              <UserIcon className="sm:hidden w-8 h-8 scale-100" />
            </Link>
          )}
          {!userQuery.isLoading && !!userQuery.data && userQuery.data.role !== 'ANONYMOUS' && (
            <Menu as="div" className="relative h-full text-primary-100">
              <Menu.Button className="h-full" id="topNav_my-account-toggle-button">
                {!!userQuery.data.firstName && (
                  <span className="hidden sm:block" data-posthog-recording-masked>
                    {userQuery.data.firstName}
                  </span>
                )}
                <>
                  <UserIcon className=" sm:hidden w-8 h-8" />
                  <span className="sr-only">Mon compte</span>
                </>
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
            'bg-white fixed top-[3.5rem] left-0 w-screen h-[calc(100dvh-3.5rem)] z-[98]',
            'transform-gpu'
          )}
          enterFrom="max-md:-translate-x-full md:-translate-y-full"
          enterTo="max-md:translate-x-0 md:translate-y-0"
          leaveFrom="max-md:translate-x-0 md:translate-y-0"
          leaveTo="max-md:-translate-x-full md:-translate-y-full"
        >
          <div className="absolute inset-0 z-98" onClick={() => setExpanded(!expanded)}></div>
          <div className="px-4 relative pt-8 md:hidden" aria-hidden>
            <button
              type="button"
              className="w-full flex justify-end rounded-full border text-primary-100 p-2"
              onClick={(e) => {
                e.preventDefault();
                searchArticlesPopoverButton.current?.click();
                return false;
              }}
            >
              <MagnifyingGlassIcon className="pointer-events-none w-6 h-6 rounded-full" />
            </button>
          </div>
          <Nav
            className="px-4 md:pt-8 w-full h-full md:h-auto overflow-y-auto shadow-sm relative"
            subMenuClassName={clsx(
              'bg-white fixed top-0 left-0 w-screen h-[calc(100dvh-3.5rem)] overflow-y-scroll z-[99] px-4 py-8'
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
