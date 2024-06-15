'use client';

import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import Image, { ImageLoader } from 'next/image';
import { useState } from 'react';

type Image = {
  url: string;
  alt: string;
  placeholderDataUrl?: string;
};

type Props = {
  images: Image[];
  width: number;
  height: number;
  className?: string;
  imageLoader?: ImageLoader;
};

export const Slides = ({ images, width, height, className, imageLoader }: Props) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  if (!imageLoader) console.warn('No imageLoader provided to Slides component. May cause performance issues.');

  return (
    <div className={clsx(className, 'flex gap-4 flex-col-reverse md:flex-row')}>
      <div className="overflow-scroll basis-[4.5rem] flex justify-center">
        <div
          className={clsx('p-1 gap-1 flex justify-center md:flex-col md:justify-start', images.length <= 1 && 'hidden')}
        >
          {images.map((image, index) => (
            <button
              key={image.url}
              type="button"
              aria-label="Afficher l'image"
              className={clsx('w-16 h-16 cursor-pointer', currentIndex === index && 'ring ring-primary-100')}
            >
              <Image
                src={image.url}
                alt={image.alt}
                width={64}
                height={64}
                loader={imageLoader}
                onClick={() => setCurrentIndex(index)}
                placeholder={image.placeholderDataUrl ? 'blur' : 'empty'}
                blurDataURL={image.placeholderDataUrl}
                className="w-full h-full object-cover object-center"
              />
            </button>
          ))}
        </div>
      </div>
      <div className="grow relative">
        {images.map((image, index) => (
          <Image
            key={image.url}
            src={image.url}
            alt={image.alt}
            width={width}
            height={height}
            loader={imageLoader}
            placeholder={image.placeholderDataUrl ? 'blur' : 'empty'}
            blurDataURL={image.placeholderDataUrl}
            className={clsx(
              'w-full h-full absolute top-0 left-0 object-cover object-center',
              currentIndex === index && 'opacity-100',
              currentIndex !== index && 'opacity-0'
            )}
            priority={index === 0}
            aria-hidden={currentIndex !== index}
            sizes="(min-width: 512px) 512px, 100vw"
          />
        ))}
        <div className={clsx('absolute left-1/2 -translate-x-1/2 bottom-2 space-x-2', images.length <= 1 && 'hidden')}>
          <button
            className="rounded-full p-2 bg-white shadow-md"
            aria-label="Précédent"
            onClick={() => setCurrentIndex((i) => (i === 0 ? images.length - 1 : i - 1))}
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          <button
            className="rounded-full p-2 bg-white shadow-md"
            aria-label="Suivant"
            onClick={() => setCurrentIndex((i) => (i === images.length - 1 ? 0 : i + 1))}
          >
            <ChevronRightIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
      {/* <div className="flex justify-center mt-2">
        {images.map((_, index) => (
          <div className="p-1 cursor-pointer" onClick={goTo(index)} key={index}>
            <div
              className={clsx(
                'w-2 h-2 bg-secondary-900 rounded-full transition-transform transform-gpu',
                index !== currentIndex && 'opacity-25 scale-75'
              )}
            ></div>
          </div>
        ))}
      </div> */}
    </div>
  );
};
