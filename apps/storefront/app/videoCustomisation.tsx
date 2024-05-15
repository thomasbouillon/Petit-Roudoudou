import Link from 'next/link';
import { routes } from '@couture-next/routing';

export async function VideoCustomisation() {
  return (
    <div className="flex flex-col justify-center items-center gap-4 my-10 ">
      <h2 className="font-serif text-center text-3xl">Créez l’univers de votre enfant en quelques clics !</h2>
      <div className="flex md:flex-row flex-col items-center justify-center gap-4 md:max-w-[35.25rem] ">
        <video id="customizationVideo" className="  max-w-[256px] " controls autoPlay muted loop>
          <source src="/videos/CustomArticles.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="flex flex-col gap-6 break-all px-6">
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod</p>
          <Link
            href={routes().shop().index({ customizableOnly: true })}
            className="btn-secondary text-center px-7 py-3 text-lg bg-white"
          >
            Personnaliser
          </Link>
        </div>
      </div>
    </div>
  );
}
