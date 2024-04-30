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
    <>
      <Link href={buttonLink}>
        <div className="flex flex-col rounded-xl min-h-full relative ">
          <div className="rounded-t-sm overflow-hidden ">
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
          <div className="  bg-white shadow-lg  rounded-b-md  flex-grow pb-2 px-2 flex flex-col">
            <div className="pt-2">
              {variant === 'customizable-article' && <p className=" text-primary-100 font-semibold">Personalisable</p>}
              <h3 className="text-2xl font-serif text-start text-pretty">{title}</h3>
            </div>

            {rating !== undefined && (
              <p className="absolute right-2 top-2 bg-white py-2 px-4 rounded-full flex items-center gap-1 text-sm">
                <span className="sr-only">Score des clients: </span>
                {rating.toFixed(1)}/5
                <StarIcon className="w-4 h-4 text-primary-100" />
              </p>
            )}
            <div className="flex-grow">
              <p className=" line-clamp-4  text-gray-500">{description}</p>
            </div>
            <div className="flex flex-row justify-between items-center">
              <div className="flex flex-col mt-2">
                {variant === 'customizable-article' && <p className="text-primary-100">À partir de</p>}
                <PrettyPrice price={price} />
              </div>
              {stock !== undefined && stock > 0 && <p className="pt-2 text-primary-100 font-medium">Expédition 48h</p>}
              {stock === 0 && <p className="pt-2 text-red-600 font-medium">Rupture de stock</p>}
            </div>
          </div>
        </div>
      </Link>
    </>
  );
}
