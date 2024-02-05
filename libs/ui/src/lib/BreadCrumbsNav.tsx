import type { Url } from 'next/dist/shared/lib/router/router';
import { ComponentType, PropsWithChildren } from 'react';
import { WithStructuedDataWrapper } from './seo';

export type NavItem = {
  label: string;
  href: string;
  // highlight?: boolean;
};

export function BreadCrumbsNav({
  items,
  Link,
  ariaLabel,
}: {
  Link: ComponentType<PropsWithChildren<{ href: Url; className?: string }>>;
  items: NavItem[];
  ariaLabel: string;
}) {
  return (
    <WithStructuedDataWrapper
      stucturedData={{
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.label,
          ...(item.href ? { item: item.href } : {}),
        })),
      }}
    >
      <nav aria-label={ariaLabel} className="mx-2">
        <ul className="flex flex-wrap pb-4 gap-2">
          {items.map((item) => (
            <li
              key={item.href}
              className="!outline-none after:content-['>'] after:inline-block after:ml-2 last:after:content-none last:underline"
            >
              <Link href={item.href}>{item.label}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </WithStructuedDataWrapper>
  );
}
