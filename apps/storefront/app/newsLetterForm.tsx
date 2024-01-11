import { StyledWrapper } from '@couture-next/ui';
import Image from 'next/image';

export function NewsletterForm() {
  return (
    <StyledWrapper className="bg-light-100 relative pt-12 pb-24">
      <Image
        src="/images/justine.webp"
        width={640}
        height={1072}
        alt="Image de justine, la créatrice."
        className=" opacity-90 absolute left- top-1/2 -translate-x-1/2 -translate-y-1/2 h-[80%] object-contain object-right pointer-events-none"
      />
      <div className="pl-[40%] pr-4 relative z-10">
        <h2 className="text-4xl text-center font-serif ">Newsletter</h2>
        <p className="text-lg text-primary-100 text-center">Ma dose de Good Vibes 🌈</p>
        <p className="text-center text-xs text-gray-600">Conseils, astuces, offres</p>
        <form action="#" className="flex flex-col items-center gap-4 mt-8 max-w-xs w-full mx-auto">
          <input type="text" className="shadow-md p-4 w-full text-center" aria-label="Prénom" placeholder="Prénom" />
          <input type="text" className="shadow-md p-4 w-full text-center" aria-label="Email" placeholder="Email" />
          <div className="text-primary-100">
            <label className="block py-1">
              <input type="radio" name="category" className="mr-2" />
              Futur parent
            </label>
            <label className="block py-1">
              <input type="radio" name="category" className="mr-2" />
              Parent
            </label>
            <label className="block py-1">
              <input type="radio" name="category" className="mr-2" />
              Juste moi 🙈
            </label>
          </div>
          <label className="text-xs pl-8">
            <input type="checkbox" className="mr-2" />
            <span className="bg-light-100">
              En cochant cette case, tu acceptes que tes données soient traitées par Petit Roudoudou pour recevoir des
              astuces, offres et infos dont tu pourras te désabonner à tout moment.
            </span>
          </label>
          <button className="btn-primary w-full shadow-sm">Rejoindre</button>
        </form>
      </div>
    </StyledWrapper>
  );
}
