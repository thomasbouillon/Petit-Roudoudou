import { Home, fetchFromCMS } from '../directus';
import Link from 'next/link';
import { WithDecorativeDotsWrapper } from '@couture-next/ui';
import { CmsImage } from './cmsImage';
import clsx from 'clsx';

export async function LinksFromCMS() {
  const cmsHome = await fetchFromCMS<Home>('home', { fields: '*.*.*' });

  return (
    <WithDecorativeDotsWrapper dotsPosition="top-right">
      <div className="grid grid-cols-2 max-w-3xl px-4 gap-2 mx-auto">
        {cmsHome.links.map((link, i) => (
          <div
            className={clsx(
              'relative flex items-center justify-center',
              'first:aspect-[2/1] first:col-span-2',
              'sm:first:aspect-auto sm:first:h-full sm:first:col-span-1 sm:first:row-span-2',
              'aspect-square',
              'sm:aspect-[2/1]'
            )}
            key={link.label}
          >
            <CmsImage
              src={link.image.filename_disk}
              alt=""
              fill
              className="object-center object-cover"
              placeholder={link.image_placeholder ? 'blur' : undefined}
              blurDataURL={link.image_placeholder}
              sizes={i === 0 ? '(min-width: 780px) 380px, 100vw' : '(min-width: 780px) 380px, 50vw'}
              priority={i === 0}
            />
            <Link className="btn-primary z-10 w-52 text-center !px-0" href={link.href}>
              {link.label}
            </Link>
          </div>
        ))}
      </div>
    </WithDecorativeDotsWrapper>
  );
}
