import FacebookIcon from '../assets/facebook.svg';
import InstagramIcon from '../assets/instagram.svg';
import TikTokIcon from '../assets/tiktok.svg';
import Link from 'next/link';
import { routes } from '@couture-next/routing';
import { StorageImage } from './StorageImage';

export default function Footer() {
  return (
    <footer className="pt-4 print:hidden">
      <div className="px-4">
        <div className="max-w-md mx-auto relative aspect-[511/124]">
          <StorageImage
            src="public/images/brand.webp"
            fill
            alt="Slogan: Petit Roudoudou, aussi unique que votre bébé."
          />
        </div>
      </div>
      <div className="relative sm:aspect-[375/26] flex items-center">
        <Link
          className="mt-4 mx-auto btn-primary z-[9] relative translate-y-1/2 sm:translate-y-0"
          href={routes().shop().listCustomizableArticles()}
        >
          Personnaliser une création
        </Link>
        <div className="sm:triangle-top bg-light-100 absolute w-full bottom-0" />
      </div>
      <div className="py-4 bg-light-100 pt-12 flex flex-col items-center">
        <ul className="flex flex-col sm:flex-row flex-wrap gap-8 justify-center">
          <li className="">
            <h3 className=" pb-3 font-semibold">Navigation</h3>
            <ul>
              <li>
                {' '}
                <Link href={routes().index()}> Accueil</Link>
              </li>
              <li>
                {' '}
                <Link href={routes().shop().index()}> Boutique</Link>
              </li>
              <li>
                {' '}
                <Link href={routes().fabrics().index()}> Tissus</Link>
              </li>
              <li>
                {' '}
                <Link href={routes().blog().index()}>Blog</Link>{' '}
              </li>
            </ul>
          </li>
          <li className="">
            <h3 className=" pb-3 font-semibold">Information</h3>
            <ul>
              <li>
                {' '}
                <Link href={routes().events().index()}>Evènements</Link>{' '}
              </li>
              <li>
                {' '}
                <Link href={routes().contactUs()}>Contact</Link>{' '}
              </li>
              <li>
                {' '}
                <Link href={routes().faq().index()}>Qui sommes-nous ?</Link>{' '}
              </li>
            </ul>
          </li>
          <li className="">
            <h3 className=" pb-3 font-semibold">Loi et l'ordre</h3>
            <ul>
              <li>
                {' '}
                <Link href={routes().legal().cgu()}>Conditions générales d'utilisation</Link>{' '}
              </li>
              <li>
                {' '}
                <Link href={routes().legal().cgv()}>Conditions générales de vente</Link>{' '}
              </li>
              <li>
                {' '}
                <Link href={routes().legal().noticies()}>Mentions légales</Link>{' '}
              </li>
            </ul>
          </li>
          <li className="">
            <p className="pb-3 font-semibold ">Nous Suivre</p>
            <ul className="flex flex-row gap-4">
              <li>
                {' '}
                <Link
                  href="https://www.facebook.com/ptitroudoudoucreatrice"
                  target="_blank"
                  className=""
                  id="topNav_facebook-button"
                >
                  <span className="sr-only">Facebook [nouvel onglet]</span>
                  <FacebookIcon className="w-8 h-8" aria-hidden />
                </Link>{' '}
              </li>
              <li>
                {' '}
                <Link href="https://www.tiktok.com/@petit_roudoudou" target="_blank" id="topNav_tiktok-button">
                  <span className="sr-only">TikTok [nouvel onglet]</span>
                  <TikTokIcon className="w-8 h-8" aria-hidden />
                </Link>{' '}
              </li>
              <li>
                {' '}
                <Link href="https://instagram.com/petit_roudoudou" target="_blank" id="topNav_instagram-button">
                  <span className="sr-only">Instagram [nouvel onglet]</span>
                  <InstagramIcon className="w-8 h-8" aria-hidden />
                </Link>{' '}
              </li>
            </ul>
          </li>
        </ul>
        <div className="p-2 text-gray-600 text-center">
          <p>© 2024 Petit Roudoudou Tous droits réservés</p>
        </div>
      </div>
    </footer>
  );
}
