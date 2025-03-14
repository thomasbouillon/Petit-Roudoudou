import { Home, fetchFromCMS, homeFields } from '../directus';
import Link from 'next/link';
import { WithDecorativeDotsWrapper } from '@couture-next/ui/WithDecorativeDotsWrapper';
import { CmsImage } from './cmsImage';
import clsx from 'clsx';
import React from 'react';

export async function LinksFromCMS() {
  const cmsHome = await fetchFromCMS<Home>('home', { fields: homeFields.join(',') });

  return (
    <WithDecorativeDotsWrapper
      dotsPosition="bottom-right"
      className="px-4"
      dotsClassName="translate-y-12 rotate-180"
      autoPadding={true}
    >
      <div className="grid sm:grid-cols-[51.6fr_48.4fr] grid-rows-2 grid-cols-2 sm:gap-6 gap-2 max-w-7xl mx-auto sm:aspect-[10.01/4] group">
        {cmsHome.links.map((link, i) => (
          <div
            key={link.href}
            className={clsx(
              'relative',
              'first:col-span-2 first:aspect-auto',
              'sm:first:row-span-2 sm:first:col-span-1',
              'aspect-square',
              'sm:aspect-auto',
              'hover:!opacity-100 group-hover:opacity-50 transition-opacity duration-300 ease-in-out'
            )}
          >
            <CmsImage
              src={link.image.filename_disk}
              srcDesktop={link.imageDesktop?.filename_disk}
              desktopBreakCssMediaCondition="min-width: 1300px"
              alt=""
              fill
              className="object-cover object-center"
              placeholder={link.image_placeholder ? 'blur' : 'empty'}
              blurDataURL={link.image_placeholder}
              sizes={i === 0 ? '(max-width: 1300px) 100vw, 650px' : '(min-width: 1300px) 610px, 50vw'}
            />
            <Link
              href={link.href}
              className="btn-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(13rem,100%)] !px-0 text-center"
            >
              {link.label}
            </Link>
          </div>
        ))}
      </div>
    </WithDecorativeDotsWrapper>
  );
}
