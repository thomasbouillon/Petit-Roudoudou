import { PrettyPrice } from '@couture-next/ui';
import Image from 'next/image';
import Link from 'next/link';

type Props = {
  title: string;
  description: string;
  image: string;
  price: number;
  stock?: number;
  buttonLabel: string;
  buttonLink: string;
  variant?: 'default' | 'customizable-article';
};

export default function Card({
  title,
  description,
  stock,
  price,
  image,
  buttonLabel,
  buttonLink,
  variant = 'default',
}: Props) {
  return (
    <>
      <div className="">
        <div className="bg-white rounded-t-sm overflow-hidden">
          <Image
            src={image}
            alt=""
            className="w-full h-full object-cover aspect-[380/230]"
            width={384}
            height={230}
          />
        </div>
        <div className="shadow-lg mb-3 bg-white rounded-b-md">
          <div className="px-4">
            <h3 className="text-2xl font-serif pt-2">
              {title}
              {variant === 'customizable-article' && (
                <span className="text-primary-100"> à personnaliser</span>
              )}
            </h3>
            <p className="mt-1 mb-3 line-clamp-6">{description}</p>
            {variant === 'customizable-article' && (
              <p className="text-primary-100">À partir de</p>
            )}
            <div className="flex justify-between">
              <PrettyPrice price={price} />
              {stock !== undefined && (
                <p className="mt-auto text-primary-100">
                  Plus que 1 en stock !
                </p>
              )}
            </div>
            <Link
              className="btn-primary w-4/5 mx-auto translate-y-4 block text-center"
              href={buttonLink}
            >
              {buttonLabel}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
