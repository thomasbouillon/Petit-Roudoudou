import { StyledWrapper } from '@couture-next/ui';
import Image from 'next/image';
import { NewsletterForm } from './newsLetterForm';

export function NewsletterSection() {
  return (
    <StyledWrapper className="bg-light-100 relative pt-12">
      <div className="-translate-y-20">
        <Image
          src="/images/justine.webp"
          width={640}
          height={1072}
          alt="Image de justine, la créatrice."
          className="opacity-90 absolute top-[40%] -translate-x-[50%] md:-translate-x-0 -translate-y-1/2 h-[90%] xl:h-[150%] md:h-[130%] object-contain object-right pointer-events-none"
        />
        <div className="pl-[40%] pr-4 relative z-10">
          <h2 className="text-4xl text-center font-serif ">Newsletter</h2>
          <p className="text-lg text-primary-100 text-center">Ma dose de Good Vibes 🌈</p>
          <p className="text-center text-xs text-gray-600">Conseils, astuces, offres</p>
          <NewsletterForm />
        </div>
      </div>
    </StyledWrapper>
  );
}
