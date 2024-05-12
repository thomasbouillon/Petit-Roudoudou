import { PrettyPrice } from '@couture-next/ui';
import Link from 'next/link';
import clsx from 'clsx';
import { StarIcon } from '@heroicons/react/24/solid';
import { StorageImage } from '../StorageImage';
import React from 'react';

export type CardProps = {
  title: string;
  titleAs?: React.ElementType;
  description?: string;
  image: string;
  placeholderDataUrl?: string;
  price: number;
  stock?: number;
  buttonLabelSrOnly: string;
  buttonLink: string;
  variant?: 'default' | 'customizable-article' | 'customizable-article-with-button' | 'customizable-article-light';
  rating?: number;
  className?: string;
  imageIsPriority?: boolean;
};

export default function Card({
  title,
  titleAs,
  description,
  stock,
  price,
  image,
  placeholderDataUrl,
  buttonLabelSrOnly,
  buttonLink,
  variant = 'default',
  rating,
  imageIsPriority = false,
  className,
}: CardProps) {
  const variantExtendsCustomizable =
    variant === 'customizable-article' ||
    variant === 'customizable-article-with-button' ||
    variant === 'customizable-article-light';

  const Title = titleAs ?? 'h3';

  return (
    <>
      <div className={clsx('bg-white flex flex-col rounded-xl shadow-lg rounded-b-md min-h-full relative', className)}>
        <div className="rounded-t-sm overflow-hidden ">
          <StorageImage
            src={image}
            alt=""
            className={clsx('w-full h-full object-cover aspect-square', stock === 0 && 'opacity-30')}
            width={256}
            height={256}
            placeholder={placeholderDataUrl ? 'blur' : 'empty'}
            blurDataURL={placeholderDataUrl}
            priority={imageIsPriority}
          />
        </div>
        <div className="flex-grow pb-2 px-2 flex flex-col">
          <div className="pt-2">
            <Title
              className={clsx(
                'text-[1.35rem] leading-[1.65rem] font-serif text-start text-pretty mb-1',
                variant === 'customizable-article-with-button' && 'sr-only'
              )}
            >
              {title}
            </Title>
            {variant === 'customizable-article' && <p className=" text-primary-100 font-semibold">Personalisable</p>}
            {variant === 'customizable-article-with-button' && (
              <p className=" btn-secondary text-center mx-auto p-2 font-semibold mt-1" aria-hidden>
                Je choisis mes tissus
              </p>
            )}
          </div>

          {rating !== undefined && (
            <p className="absolute right-2 top-2 bg-white py-2 px-4 rounded-full flex items-center gap-1 text-sm">
              <span className="sr-only">Score des clients: </span>
              {rating.toFixed(1)}/5
              <StarIcon className="w-4 h-4 text-primary-100" />
            </p>
          )}
          <div className="flex-grow">
            <p className=" line-clamp-4 text-gray-500 text-pretty">{description}</p>
          </div>
          <div
            className={clsx(
              'flex sm:flex-row flex-col items-center',
              variant === 'customizable-article-light' ? 'justify-center' : 'justify-between'
            )}
          >
            <div className="flex flex-col mt-2 items-center">
              {variantExtendsCustomizable && <p className="text-black">À partir de</p>}
              <PrettyPrice price={price} />
            </div>
            {stock !== undefined && stock > 0 && <p className="pt-2 text-primary-100 font-medium">Expédition 48h</p>}
            {stock === 0 && <p className="pt-2 text-red-600 font-medium">Rupture de stock</p>}
          </div>
        </div>
        <Link href={buttonLink} className="absolute top-0 left-0 right-0 bottom-0">
          <span className="sr-only">{buttonLabelSrOnly}</span>
        </Link>
      </div>
    </>
  );
}
