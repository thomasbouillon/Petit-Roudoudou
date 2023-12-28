import Image from 'next/image';
import Hero from './hero';
import { Carousel, StyledWrapper } from '@couture-next/ui';
import clsx from 'clsx';
import News from './news';
import NewsPlaceholder from './newsPlaceholder';
import { generateMetadata } from '@couture-next/utils';
import { Suspense } from 'react';
import Fundamentals from './fundamentals';
import ManufacturingTimes from './manufacturingTimes';

export const metadata = generateMetadata({
  description:
    'Explorez l&apos;univers Petit Roudoudou et créez des articles de puériculture Made in France, uniques, 100% personnalisables pour votre enfant. Choisissez parmi notre large gamme de tissu pour rendre votre création unique.',
});

export default function Page() {
  return (
    <>
      <div className="bg-light-100">
        <div className="flex flex-col-reverse pb-4">
          <ManufacturingTimes className="text-center" />
          <Hero />
          <h1 className="font-serif text-4xl text-center mb-7 px-8 pt-5">
            Créez l&apos;univers de votre enfant en quelques clics !
          </h1>
          <Suspense fallback={<NewsPlaceholder />}>
            <News />
          </Suspense>
        </div>
      </div>
      <div className="triangle-bottom bg-light-100"></div>
      <section className="mt-8">
        <h2 className="text-4xl font-serif text-center mt-8 px-8">Les fondements de Petit Roudoudou</h2>
        <ol
          className={clsx(
            'bg-white-100 flex flex-col items-center max-w-4xl gap-8 mt-8',
            'md:mx-auto md:flex-row md:justify-between md:items-stretch md:gap-0'
          )}
        >
          <Fundamentals />
        </ol>
      </section>
      <StyledWrapper className="bg-light-100 mt-8 py-12">
        <h2 className="sr-only">Inspirations</h2>
        <Carousel images={[]} />
        <a className="btn-primary mx-auto mt-4">Voir la boutique</a>
      </StyledWrapper>
      <div className="relative pb-2 mt-10">
        <div className="max-w-prose mx-auto text-justify px-5">
          <h2 className="text-4xl font-serif mb-5 text-center">A propos</h2>
          <p>
            P&apos;tit Roudoudou est une société de confection d&apos;articles de puériculture basée en France depuis
            mai 2021 qui a pour objectif de proposer aux parents des articles haut de gamme pour leurs enfants.{' '}
          </p>

          <p className="mt-2">
            <strong>Les besoins de l&apos;enfant sont notre priorité et sont au coeur de chaque collection.</strong>
          </p>

          <p className="mt-2">
            Pour cela, nous avons sélectionné soigneusement nos matériaux grâce à un imprimeur textile européen certifié{' '}
            <strong>oeko-tex et éco-Fabric</strong> Print.
          </p>

          <p className="mt-2">
            Le label oeko-tex signifie que les tissus sont testés en laboratoire pour garantir qu&apos;ils ne
            contiennent pas de substances nocives pour le consommateur. La confection est ensuite réalisée en France à
            Nancy puis les articles sont distribués dans le monde entier.
          </p>
        </div>
        <div className="w-full pl-4 max-w-md mx-auto mt-8">
          <div className="relative aspect-[361/286]">
            <Image src="/images/map.png" fill alt="Carte du monde" />
            <p className="sr-only">L&apos;imprimeur se situe en pologne. La confection est réalisée en France.</p>
          </div>
        </div>
      </div>
    </>
  );
}
