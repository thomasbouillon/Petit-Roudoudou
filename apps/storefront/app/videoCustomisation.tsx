import Link from 'next/link';
import { routes } from '@couture-next/routing';
import { WithDecorativeDotsWrapper } from '@couture-next/ui/WithDecorativeDotsWrapper';
import CustomizedArticleDemo from './(components)/CustomizedArticleDemo';

export async function VideoCustomisation() {
  return (
    <WithDecorativeDotsWrapper dotsPosition={['top-right', 'bottom-left']} dotsClassName="hidden sm:block">
      <h2 className="sr-only">Toutes nos créations sont 100% personnalisables sur le site.</h2>
      <div className="flex justify-center">
        <div className="flex md:flex-row flex-col items-center justify-center gap-4 md:max-w-[35.25rem] ">
          <CustomizedArticleDemo />
          <div className="flex flex-col gap-6 px-6">
            <p className="font-bold">Créations 100% uniques avec le système de personnalisation en ligne</p>
            <Link
              href={routes().shop().listCustomizableArticles()}
              className="btn-primary text-center px-7 py-3 text-lg flex items-center justify-center gap-2 w-full"
            >
              Personnaliser
            </Link>
          </div>
        </div>
      </div>
      <div className="triangle-top bg-light-100 mt-8"></div>
    </WithDecorativeDotsWrapper>
  );
}
