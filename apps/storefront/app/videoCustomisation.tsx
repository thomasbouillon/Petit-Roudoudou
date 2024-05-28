import Link from 'next/link';
import { routes } from '@couture-next/routing';
import { WithDecorativeDotsWrapper } from '@couture-next/ui';
import env from '../env';

const getVideoUrl = (pathname: string) => new URL(pathname, env.CDN_BASE_URL).toString();

export async function VideoCustomisation() {
  return (
    <WithDecorativeDotsWrapper dotsPosition={['top-right', 'bottom-left']} dotsClassName="hidden sm:block">
      <h2 className="sr-only">Toutes nos créations sont 100% personnalisables sur le site.</h2>
      <div className="flex justify-center">
        <div className="flex md:flex-row flex-col items-center justify-center gap-4 md:max-w-[35.25rem] ">
          <video className="max-w-[256px] aspect-square shadow rounded-sm" autoPlay muted loop playsInline>
            <source src={getVideoUrl('public/videos/CustomArticles.mp4')} type="video/mp4" />
            <source src={getVideoUrl('public/videos/CustomArticles.webm')} type="video/webm" />
            Video de présentation de plusieurs articles avec différents tissus dans notre outil de personnalisation en
            ligne
          </video>
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
