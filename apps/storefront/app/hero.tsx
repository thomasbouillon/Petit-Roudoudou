'use client';
import clsx from 'clsx';
import Image from 'next/image';
import Link from 'next/link';
import { HTMLProps, useState } from 'react';
import { useInView } from 'react-intersection-observer';

export default function Hero() {
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const { inView, ref } = useInView({
    threshold: 0.5,
  });

  return (
    <div
      className="overflow-x-hidden py-8 px-5 animate-on-scroll relative"
      ref={ref}
    >
      <div className="flex justify-center font-light italic pb-8">
        <Card
          text="100% personnalisable"
          image={{
            url: '/images/hero1.jpg',
            alt: 'Une couverture de la boutique',
          }}
          className={clsx(
            'relative z-40',
            inView && '-rotate-6',
            !inView && 'translate-x-1/2 translate-y-[75%]'
          )}
        />
        <Card
          text="Tissus 100% oeko-tex"
          image={{
            url: '/images/hero2.jpg',
            alt: 'Un carnet de santé de la boutique',
          }}
          className={clsx(
            'relative z-30',
            inView && 'rotate-2',
            !inView && 'rotate-1 translate-x-[-48%] translate-y-[73%]'
          )}
        />
      </div>
      <div className="flex justify-center font-light italic pt-24">
        <Card
          text="Fait main en Lorraine"
          image={{ url: '/images/hero3.jpg', alt: 'Un bavoir de la boutique' }}
          className={clsx(
            'relative z-20',
            inView && 'rotate-3  -translate-y-10 translate-x-5',
            !inView && 'rotate-2 translate-x-[48%] translate-y-[-83%]'
          )}
        />
        <Card
          text="Livraison rapide"
          image={{ url: '/images/hero4.jpg', alt: 'Un bavoir de la boutique' }}
          className={clsx(
            'relative z-10 -rotate-3',
            inView && '-translate-y-2',
            !inView && '-translate-x-1/2 translate-y-[-84%]'
          )}
        />
      </div>
      <Link
        href="#TODO"
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
  ...props
}: HTMLProps<HTMLDivElement> & {
  image: {
    url: string;
    alt: string;
  };
  text: string;
}) {
  return (
    <div className="basis-72">
      <div
        className={clsx(
          'bg-white ease-in-out transform-gpu transition-transform p-2 sm:p-4 drop-shadow-lg',
          className
        )}
        {...props}
      >
        <Image
          src={image.url}
          className="w-full aspect-square"
          width={272}
          height={272}
          alt={image.alt}
          style={{
            aspectRatio: '1/1',
            objectFit: 'cover',
          }}
        />
        <p className="pt-3 text-center">{text}</p>
      </div>
    </div>
  );
}
