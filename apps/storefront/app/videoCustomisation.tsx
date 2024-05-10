import Link from 'next/link';
import { routes } from '@couture-next/routing';
import { trpc } from 'apps/storefront/trpc-server';

export async function VideoCustomisation() {
  return (
    <div className="flex flex-col justify-center items-center gap-6 my-10">
      <h2 className="font-serif text-center text-3xl">Créez l’univers de votre enfant en quelques clics !</h2>
      <video id="customizationVideo" className=" w-11/12 max-w-2xl rounded-md shadow-md" controls autoPlay muted loop>
        <source src="../public/videos/Sequence_02.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      {/*trying to make a loop slider of the keyword inspiration form, NewsCarroussel  but a loop doesn't come back, and Infobanner */}
      <ul className="text-4xl font-semibold text-center min-w-[200vw] md:animate-[slide-half-left_60s_linear_infinite] animate-[slide-half-left_30s_linear_infinite]flex justify-around gap-8">
        <li>IMAGINER</li>
        <li>PERSONNALISER</li>
        <li>OFFRER</li>
      </ul>
      <Link
        href={routes().shop().index({ customizableOnly: true })}
        className="btn-secondary px-7 py-3 text-lg bg-white"
      >
        Personnaliser
      </Link>
    </div>
  );
}
