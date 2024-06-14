'use client';

import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from '@headlessui/react';
import { Nav, NavItem } from '@couture-next/ui/Nav';
import { Spinner } from '@couture-next/ui/Spinner';
import Link from 'next/link';
import { useBlockBodyScroll } from '../contexts/BlockBodyScrollContext';
import useIsMobile from '../hooks/useIsMobile';
import { usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { CartPreview } from './cartPreview';
import { routes } from '@couture-next/routing';
import { Article } from '@couture-next/types';
// import { SearchArticles } from './searchArticles';
import { MagnifyingGlassIcon, UserIcon } from '@heroicons/react/24/outline';
import { trpc } from '../trpc-client';
import { ArticleTheme } from '@prisma/client';
import { StorageImage } from './StorageImage';

const getThemeRoutes = (articles: Article[], articleThemes: ArticleTheme[]): NavItem[] => {
  return articleThemes
    .filter((theme) => articles.some((article) => article.themeId === theme.id))
    .map((theme) => ({
      label: theme.name,
      href: routes().shop().theme(theme.slug).index(),
    }));
};

const getPublicNavRoutes = (articles: Article[], articleThemes: ArticleTheme[], isAdmin: boolean): NavItem[] => [
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
    label: 'Boutique',
    href: routes().shop().index(),
  },
  ...getThemeRoutes(articles, articleThemes),
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

  const allArticleThemesQuery = trpc.articleThemes.list.useQuery();

  useEffect(() => {
    if (!isMobile) blockBodyScroll(false);
    else blockBodyScroll(expanded);
  }, [expanded, blockBodyScroll, isMobile]);

  const currentRoute = usePathname();
  useEffect(() => {
    setExpanded(false);
  }, [currentRoute, setExpanded]);

  const navRoutes = useMemo(
    () => getPublicNavRoutes(allArticlesQuery.data ?? [], allArticleThemesQuery.data ?? [], isAdmin),
    [isAdmin, allArticlesQuery.data]
  );

  return (
    <>
      <div className="h-[3.5rem] grid grid-cols-[1fr,auto,1fr] sticky top-0 bg-white z-[100] pl-4 pr-1 gap-4 print:hidden">
        <button
          className="w-14 h-14 relative text-primary-100 mr-8"
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
            <span className="sr-only">Page d'accueil</span>
          </Link>
        </div>
        <div className="flex items-center justify-end gap-4">
          <div className="hidden sm:block">{/* <SearchArticles buttonRef={searchArticlesPopoverButton} /> */}</div>

          {userQuery.isLoading && <Spinner className="w-8 h-8  text-primary-100" />}
          {!userQuery.isLoading && (!userQuery.data || userQuery.data.role === 'ANONYMOUS') && (
            <>
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
              <Link href={routes().auth().register()} className="sr-only">
                Créer un compte
              </Link>
            </>
          )}
          {!userQuery.isLoading && !!userQuery.data && userQuery.data.role !== 'ANONYMOUS' && (
            <Menu as="div" className="relative h-full text-primary-100">
              <MenuButton className="h-full" id="topNav_my-account-toggle-button">
                {!!userQuery.data.firstName && (
                  <span className="hidden sm:block" data-posthog-recording-masked>
                    {userQuery.data.firstName}
                  </span>
                )}
                <>
                  <UserIcon className=" sm:hidden w-8 h-8" />
                  <span className="sr-only">Mon compte</span>
                </>
              </MenuButton>
              <MenuItems
                modal={false}
                className="absolute top-full right-0 bg-white rounded-sm shadow-md p-4 border space-y-2"
              >
                <MenuItem as={Link} href={routes().account().index()} id="topNav_my-account-button">
                  Mon compte
                </MenuItem>
                <MenuItem as="button" onClick={() => logoutMutation.mutateAsync()} id="topNav_logout-button">
                  Déconnexion
                </MenuItem>
              </MenuItems>
            </Menu>
          )}
          <CartPreview />
        </div>
      </div>
      <div id="nav-bar">
        <Transition
          as="div"
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
          <Nav
            className="px-4 md:pt-8 w-full h-full overflow-y-auto shadow-sm relative"
            subMenuClassName={clsx(
              'bg-white fixed top-0 left-0 w-screen h-[calc(100dvh-3.5rem)] overflow-y-scroll z-[99] px-4 py-8'
            )}
            items={navRoutes}
            Link={Link}
            footer={
              <Link href={routes().shop().listCustomizableArticles()} className="btn-primary mx-auto mt-6">
                Personnaliser un article
              </Link>
            }
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
