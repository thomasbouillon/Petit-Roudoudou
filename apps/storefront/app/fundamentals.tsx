'use client';

import { useQuery } from '@tanstack/react-query';
import { Home, fetchFromCMS } from '../directus';
import { PropsWithChildren } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { loader } from '../utils/next-image-directus-loader';

export default function Fundamentals() {
  const { data: cmsHome, error } = useQuery({
    queryKey: ['cms', 'home'],
    queryFn: () => fetchFromCMS<Home>('home', { fields: '*.*.*' }),
  });
  if (error) throw error;

  return cmsHome?.fundamentals.map((fundamental, i) => (
    <CardLayout title={fundamental.title} text={fundamental.text} i={i + 1} key={fundamental.id}>
      {fundamental.type === 'link' ? (
        <Link href={fundamental.link} className="btn-primary mx-auto">
          {fundamental.link_label}
        </Link>
      ) : (
        <Image
          src={fundamental.image.filename_disk}
          width={100}
          height={100}
          alt="Label oeko-tex"
          loader={loader}
          placeholder={fundamental.placeholder ? 'blur' : 'empty'}
          blurDataURL={fundamental.placeholder}
          className="h-24 mx-auto mt-2 w-auto"
        />
      )}
    </CardLayout>
  ));
}

function CardLayout({
  title,
  i,
  text,
  children,
}: PropsWithChildren<{
  i: number;
  title: string;
  text: string;
}>) {
  return (
    <li>
      <div className="bg-secondary-100 shadow-md relative w-64 p-6 pt-10 mt-6 text-secondary-900 h-full flex flex-col">
        <h3 className="font-bold text-center text-black">{title}</h3>
        <p className="mt-4">{text}</p>
        <div className="mt-auto">{children}</div>
        <div aria-hidden className="absolute left-0 top-0 translate-x-1/2 -translate-y-1/2">
          <article className="bg-primary-100 text-white rounded-full relative w-12 h-12">
            <span className="font-bold font-serif text-3xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              {i}
            </span>
          </article>
        </div>
      </div>
    </li>
  );
}
