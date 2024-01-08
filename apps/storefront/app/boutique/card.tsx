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
}: Props) {
  return (
    <div className="flex flex-col relative">
      <div className="bg-white rounded-t-sm overflow-hidden">
        <Image
          src={image}
          alt=""
          className="w-full h-full object-cover aspect-[380/230]"
          loader={loader}
          width={384}
          height={230}
          placeholder={placeholderDataUrl ? 'blur' : 'empty'}
          blurDataURL={placeholderDataUrl}
        />
      </div>
      <div className="shadow-lg mb-4 bg-white rounded-b-md flex-grow px-4 flex flex-col">
        <h3 className="text-2xl font-serif pt-2">
          {title}
          {variant === 'customizable-article' && <span className="text-primary-100"> à personnaliser</span>}
        </h3>
        {rating !== undefined && (
          <p className="absolute right-2 top-2 bg-white py-2 px-4 rounded-full flex items-center gap-1 text-sm">
            <span className="sr-only">Score des clients: </span>
            {rating.toFixed(1)}/5
            <StarIcon className="w-4 h-4 text-primary-100" />
          </p>
        )}
        <p className="mt-1 mb-3 line-clamp-6 flex-grow">{description}</p>
        {variant === 'customizable-article' && <p className="text-primary-100">À partir de</p>}
        <div className="flex justify-between">
          <PrettyPrice price={price} />
          {stock !== undefined && <p className="mt-auto text-primary-100">Plus que 1 en stock !</p>}
        </div>
        <Link
          className={clsx(
            'w-4/5 mx-auto block text-center mt-auto translate-y-4',
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
