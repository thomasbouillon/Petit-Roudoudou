import Image from 'next/image';
import Hero from './hero';
import { Carousel } from '@couture-next/ui';
import clsx from 'clsx';
import Link from 'next/link';
import News from './news';

export default async function Index() {
  return (
    <>
      <div className="bg-light-100">
        <div className="flex flex-col-reverse">
          <Hero />
          <h1 className="font-serif text-4xl text-center mb-7 px-8 pt-5">
            Créez l&apos;univers de votre enfant en quelques clics !
          </h1>
          <News
            news={[
              {
                image: '/images/hero1.jpg',
                imageAlt: 'Image 1',
                title: 'Nouvelle collection\n2021',
                href: '#TODO',
              },
              {
                image: '/images/hero2.jpg',
                imageAlt: 'Image 2',
                title: 'Nouvelle collection\n2023',
                href: '#TODO',
              },
              {
                image: '/images/hero3.jpg',
                imageAlt: 'Image 3',
                title: 'Nouvelle collection\n2024',
                href: '#TODO',
              },
            ]}
          />
        </div>
      </div>
      <div className="triangle-bottom bg-light-100"></div>
      <section className="mt-8">
        <h2 className="text-4xl font-serif text-center mt-8 px-8">
          Les fondements de Petit Roudoudou
        </h2>
        <ol
          className={clsx(
            'bg-white-100 flex flex-col items-center max-w-4xl gap-8 mt-8',
            'md:mx-auto md:flex-row md:justify-between md:items-stretch md:gap-0'
          )}
        >
          <li>
            <CardLayout
              i={1}
              title="Quand les parents deviennent les créateurs de l'univers enfantin !"
              text="Votez pour la prochaine collection de tissus et créations."
            >
              <Link href="#TODO" className="btn-primary mx-auto">
                Voter
              </Link>
            </CardLayout>
          </li>
          <li>
            <CardLayout
              title="Respect de la santé"
              i={2}
              text={
                'Le label oeko-tex signifie que les tissus sont testés en laboratoire pour garantir qu&apos;ils ne contiennent pas de substances nocives pour le consommateur.'
              }
            >
              <Image
                src="/images/logo-oeko-tex.png"
                width={100}
                height={100}
                alt="Label oeko-tex"
                quality={100}
                className="w-24 mx-auto mt-2"
              />
            </CardLayout>
          </li>
          <li>
            <CardLayout
              title="Respect de l'environment"
              i={3}
              text={
                'Nos tissus sont produits selon l&apos;exigence du label eco fabric print.'
              }
            >
              <Image
                src="/images/logo-eco-fabric-print.png"
                width={50}
                height={100}
                alt="Label oeko-tex"
                className="w-16 mx-auto mt-2"
              />
            </CardLayout>
          </li>
        </ol>
      </section>
      <div className="triangle-top bg-light-100 mt-8"></div>
      <div className="bg-light-100 py-12">
        <h2 className="sr-only">Inspirations</h2>
        <Carousel
          images={[
            {
              url: '/images/hero1.jpg',
              alt: 'Image 1',
            },

            {
              url: '/images/hero2.jpg',
              alt: 'Image 2',
            },

            {
              url: '/images/hero3.jpg',
              alt: 'Image 3',
            },
          ]}
        />
        <a className="btn-primary mx-auto mt-4">Voir la boutique</a>
      </div>
      <div className="triangle-bottom bg-light-100"></div>
      <div className="relative pb-2 mt-10">
        <div className="max-w-prose mx-auto text-justify px-5">
          <h2 className="text-4xl font-serif mb-5 text-center">A propos</h2>
          <p>
            P&apos;tit Roudoudou est une société de confection d&apos;articles
            de puériculture basée en France depuis mai 2021 qui a pour objectif
            de proposer aux parents des articles haut de gamme pour leurs
            enfants.{' '}
          </p>

          <p className="mt-2">
            <strong>
              Les besoins de l&apos;enfant sont notre priorité et sont au coeur
              de chaque collection.
            </strong>
          </p>

          <p className="mt-2">
            Pour cela, nous avons sélectionné soigneusement nos matériaux grâce
            à un imprimeur textile européen certifié{' '}
            <strong>oeko-tex et éco-Fabric</strong> Print.
          </p>

          <p className="mt-2">
            Le label oeko-tex signifie que les tissus sont testés en laboratoire
            pour garantir qu&apos;ils ne contiennent pas de substances nocives
            pour le consommateur. La confection est ensuite réalisée en France à
            Nancy puis les articles sont distribués dans le monde entier.
          </p>
        </div>
        <div className="w-full pl-4 max-w-md mx-auto mt-8">
          <div className="relative aspect-[361/286]">
            <Image src="/images/map.png" fill alt="Carte du monde" />
            <p className="sr-only">
              L&apos;imprimeur se situe en pologne. La confection est réalisée
              en France.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function CardLayout({
  title,
  i,
  text,
  children,
}: {
  title: string;
  text: string;
  i: number;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-secondary-100 shadow-md relative w-64 p-6 pt-10 mt-6 text-secondary-900 h-full flex flex-col">
      <h3 className="font-bold text-center text-black">{title}</h3>
      <p className="mt-4">{text}</p>
      <div className="mt-auto">{children}</div>
      <div
        aria-hidden
        className="absolute left-0 top-0 translate-x-1/2 -translate-y-1/2"
      >
        <article className="bg-primary-100 text-white rounded-full relative w-12 h-12">
          <span className="font-bold font-serif text-3xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            {i}
          </span>
        </article>
      </div>
    </div>
  );
}
