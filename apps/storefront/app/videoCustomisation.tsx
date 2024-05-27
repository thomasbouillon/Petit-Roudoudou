import Link from 'next/link';
import { routes } from '@couture-next/routing';
import { StyledWrapper, WithDecorativeDotsWrapper } from '@couture-next/ui';

export async function VideoCustomisation() {
  return (
    <WithDecorativeDotsWrapper dotsPosition={['top-right', 'bottom-left']} dotsClassName="hidden sm:block">
      <h2 className="sr-only">Toutes nos créations sont 100% personnalisables sur le site.</h2>
      <div className="flex justify-center">
        <div className="flex md:flex-row flex-col items-center justify-center gap-4 md:max-w-[35.25rem] ">
          <video id="customizationVideo" className="max-w-[256px] shadow rounded-sm" autoPlay muted loop playsInline>
            <source src="/videos/CustomArticles.mp4" type="video/mp4" />
            <source src="/videos/CustomArticles.webm" type="video/webm" />
            Your browser does not support the video tag.
          </video>
          <div className="flex flex-col gap-6 px-6">
            <p className="font-bold">Créations 100% uniques avec le système de personnalisation en ligne</p>
            <Link
              href={routes().shop().listCustomizableArticles()}
              className="btn-primary text-center px-7 py-3 text-lg"
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
