import { applyTaxes } from '@couture-next/utils';
import { routes } from '@couture-next/routing';
import { trpc } from 'apps/storefront/trpc-server';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/solid';
import { Carousel } from '@couture-next/ui';
import Link from 'next/link';
import Image from 'next/image';
import { loader } from '../utils/next-image-firebase-storage-loader';

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
                <ArrowTopRightOnSquareIcon className="inline-block w-5 h-5 bg-white" />
              </Link>
              <Carousel.Controls className="ml-auto" />
            </div>
            <Carousel.Items className="pb-8 sm:px-4 px-2">
              {articles.map((article) => (
                <Carousel.Item className="sm:basis-[34rem] basis-[calc(100%)]" key={article.id}>
                  <div className="relative rounded-md bg-white shadow-lg grid grid-cols-2 ">
                    <Image
                      src={article.images[0].url}
                      alt={article.namePlural}
                      className="w-full aspect-square object-cover"
                      loader={loader}
                      width={544 / 2}
                      height={544 / 2}
                    />
                    <div className="flex flex-col sm:gap-6 gap-2 sm:p-6 p-1 pt-2">
                      <div className="sm:text-2xl text-xl leading-5 font-serif px-2 sm:px-4 ">{article.namePlural}</div>
                      <div className="sm:line-clamp-5 hidden text-base px-4"> {article.description}</div>
                      <div className="sm:hidden block text-sm px-2" aria-hidden>
                        {article.shortDescription}
                      </div>
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
