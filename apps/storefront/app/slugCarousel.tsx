/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/jsx-key */
import { applyTaxes } from '@couture-next/utils';
import { routes } from '@couture-next/routing';
import { trpc } from 'apps/storefront/trpc-server';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/solid';
import { Carousel } from '@couture-next/ui';
import Link from 'next/link';

export async function SlugCarousel() {
  const articles = await trpc.articles.list.query();
  return (
    <>
      <div className="space-y-8">
        <div>
          <Carousel.Container as="div">
            <div className="flex items-center mb-4 gap-4 px-4">
              <h2 className="text-2xl font-serif">Nos Catégories</h2>
              <Link href={routes().shop().index()}>
                <span className="sr-only">Voir la boutique</span>
                <ArrowTopRightOnSquareIcon className="inline-block w-5 h-5" />
              </Link>
              <Carousel.Controls className="ml-auto" />
            </div>
            <Carousel.Items className="pb-8 sm:px-4 px-2">
              {articles.map((article) => (
                <Carousel.Item key={article.id}>
                  <div className="relative">
                    <img
                      src={article.images[0].url}
                      alt={article.namePlural}
                      className="w-full h-full aspect-square object-cover rounded-md"
                    />
                    <div className="absolute bottom-0 left-0 w-full   bg-white bg-opacity-80  text-xl font-serif text-center  p-1">
                      {article.namePlural}
                    </div>
                    <Link
                      href={routes().shop().article(article.slug).index()}
                      className="absolute top-0 left-0 right-0 bottom-0"
                    ></Link>
                  </div>
                </Carousel.Item>
              ))}
            </Carousel.Items>
          </Carousel.Container>
        </div>
      </div>
    </>
  );
}
