import { PrettyPrice } from '@couture-next/ui';
import { loader } from '../../utils/next-image-firebase-storage-loader';
import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';
import { StarIcon } from '@heroicons/react/24/solid';

type Props = {
  title: string;
  description: string;
  image: string;
  placeholderDataUrl?: string;
  price: number;
  stock?: number;
  buttonLabel: string;
  buttonLink: string;
  variant?: 'default' | 'customizable-article';
  rating?: number;

  imageIsPriority?: boolean;
};

export default function Card({
  title,
  description,
  stock,
  price,
  image,
  placeholderDataUrl,
  buttonLabel,
  buttonLink,
  variant = 'default',
  rating,
  imageIsPriority = false,
}: Props) {
  return (
    <div className="flex flex-col relative">
      <div className="bg-white rounded-t-sm overflow-hidden">
        <Image
          src={image}
          alt=""
          className={clsx('w-full h-full object-cover aspect-square', stock === 0 && 'opacity-30')}
          loader={loader}
          width={256}
          height={256}
          placeholder={placeholderDataUrl ? 'blur' : 'empty'}
          blurDataURL={placeholderDataUrl}
          priority={imageIsPriority}
        />
      </div>
      <div className="shadow-lg mb-4 bg-white rounded-b-md flex-grow px-4 flex flex-col">
        <h3 className="text-2xl font-serif pt-2 text-center sm:text-start text-pretty">
          {title}
          {variant === 'customizable-article' && (
            <span className="text-primary-100">
              {' '}
              à personnaliser <span className="max-sm:sr-only">en ligne</span>
            </span>
          )}
        </h3>
        {rating !== undefined && (
          <p className="absolute right-2 top-2 bg-white py-2 px-4 rounded-full flex items-center gap-1 text-sm">
            <span className="sr-only">Score des clients: </span>
            {rating.toFixed(1)}/5
            <StarIcon className="w-4 h-4 text-primary-100" />
          </p>
        )}
        <div className="flex-grow">
          <p className="mt-1 line-clamp-4 max-md:sr-only">{description}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center sm:items-end sm:justify-between mt-3">
          {variant === 'customizable-article' && <p className="sm:text-primary-100">À partir de</p>}
          <PrettyPrice price={price} />
          {stock !== undefined && stock > 0 && <p className="mt-auto text-primary-100">Expédition 48h</p>}
          {stock === 0 && <p className="mt-auto text-primary-100">Rupture de stock</p>}
        </div>
        <Link
          className={clsx(
            'sm:w-4/5 px-3 py-3 sm:py-4 sm:px-8 mx-auto block text-center mt-auto translate-y-4',
            variant === 'customizable-article' && 'btn-light bg-white border-2 border-current',
            variant === 'default' && 'btn-primary'
          )}
          href={buttonLink}
        >
          {buttonLabel}
        </Link>
      </div>
    </div>
  );
}
