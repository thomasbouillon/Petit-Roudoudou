import Link from 'next/link';
import { routes } from '@couture-next/routing';

export async function VideoCustomisation() {
  return (
    <div className="flex justify-center">
      <h2 className="font-serif text-center text-3xl sr-only">Tous les articles sont 100% personnalisables</h2>
      <div className="flex md:flex-row flex-col items-center justify-center gap-4 md:max-w-[35.25rem] ">
        <video id="customizationVideo" className="  max-w-[256px] " autoPlay muted loop playsInline>
          <source src="/videos/CustomArticles.mp4" type="video/mp4" />
          <source src="/videos/CustomArticles.webm" type="video/webm" />
          Your browser does not support the video tag.
        </video>
        <div className="flex flex-col gap-6 break-all px-6">
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod</p>
          <Link href={routes().shop().listCustomizableArticles()} className="btn-primary text-center px-7 py-3 text-lg">
            Personnaliser
          </Link>
        </div>
      </div>
    </div>
  );
}
