'use client';

import { routes } from '@couture-next/routing';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import Image from 'next/image';
import Link from 'next/link';
import { HTMLProps, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { Home, fetchFromCMS } from '../directus';
import { loader } from '../utils/next-image-directus-loader';

export default function Hero() {
  const [showEasterEgg] = useState(false);
  const { inView, ref } = useInView({
    threshold:
      typeof window !== 'undefined' && window.innerHeight > 680 ? 0.5 : 0.3,
  });

  const { data: cmsHome, error } = useQuery({
    queryKey: ['cms', 'hero'],
    queryFn: () => fetchFromCMS<Home>('home', { fields: '*.*.*' }),
  });
  if (error) throw error;

  const CardImageFromCMSCard = (cmsCard?: Home['hero_cards'][0]) =>
    cmsCard
      ? {
          url: cmsCard.image.id,
          placeholder: cmsCard.placeholder,
          alt: '',
        }
      : undefined;

  return (
    <div
      className="overflow-x-hidden py-8 px-5 animate-on-scroll relative"
      ref={ref}
    >
      <div className="flex justify-center font-light italic pb-8">
        <Card
          text={cmsHome?.hero_cards[0]?.title}
          image={CardImageFromCMSCard(cmsHome?.hero_cards[0])}
          className={clsx(
            'relative z-40',
            inView && '-rotate-6',
            !inView && 'translate-x-1/2 translate-y-[75%]'
          )}
          priority
        />
        <Card
          text={cmsHome?.hero_cards[1]?.title}
          image={CardImageFromCMSCard(cmsHome?.hero_cards[1])}
          className={clsx(
            'relative z-30',
            inView && 'rotate-2',
            !inView && 'rotate-1 translate-x-[-48%] translate-y-[73%]'
          )}
          priority
        />
      </div>
      <div className="flex justify-center font-light italic pt-24">
        <Card
          text={cmsHome?.hero_cards[2]?.title}
          image={CardImageFromCMSCard(cmsHome?.hero_cards[2])}
          className={clsx(
            'relative z-20',
            inView && 'rotate-3  -translate-y-10 translate-x-5',
            !inView && 'rotate-2 translate-x-[48%] translate-y-[-83%]'
          )}
        />
        <Card
          text={cmsHome?.hero_cards[3]?.title}
          image={CardImageFromCMSCard(cmsHome?.hero_cards[3])}
          className={clsx(
            'relative z-10 -rotate-3',
            inView && '-translate-y-2',
            !inView && '-translate-x-1/2 translate-y-[-84%]'
          )}
        />
      </div>
      <Link
        href={routes().shop().index()}
        className="btn-primary -mt-4 w-max absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2"
      >
        Voir la boutique
      </Link>
      {showEasterEgg && (
        <p className="text-center absolute bottom-0 left-2 right-2">
          C&apos;est cool comme animation :&#41;
        </p>
      )}
    </div>
  );
}

function Card({
  image,
  text,
  className,
  priority,
  ...props
}: HTMLProps<HTMLDivElement> & {
  priority?: boolean;
  image?: {
    url: string;
    alt: string;
    placeholder?: string;
  };
  text?: string;
}) {
  return (
    <div className="basis-72">
      <div
        className={clsx(
          'bg-white ease-in-out transform-gpu transition-transform p-2 sm:p-4 drop-shadow-lg',
          className,
          !image && 'placeholder'
        )}
        {...props}
      >
        {image ? (
          <Image
            src={image.url}
            className="w-full aspect-square object-cover object-center"
            width={272}
            height={272}
            alt={image.alt}
            loader={loader}
            priority={priority}
            placeholder={image.placeholder ? 'blur' : undefined}
            blurDataURL={image.placeholder}
          />
        ) : (
          <div className="w-full aspect-square" {...props} />
        )}
        <p className="pt-3 text-center">{text ?? '\u00A0'}</p>
      </div>
    </div>
  );
}
