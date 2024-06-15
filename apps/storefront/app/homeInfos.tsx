import { Home, fetchFromCMS } from '../directus';
import Link from 'next/link';
import { routes } from '@couture-next/routing';
import { Fragment } from 'react';
import { WithDecorativeDotsWrapper } from '@couture-next/ui/WithDecorativeDotsWrapper';
import HomeInfosBackground from './homeInfosBackground';

export async function HomeInfos() {
  const cmsHome = await fetchFromCMS<Home>('home', { fields: '*.*.*' });

  return (
    <WithDecorativeDotsWrapper dotsPosition={['top-left', 'bottom-right']} autoPadding={false} className="pt-1">
      <div className="bg-gray-200 relative">
        <div
          style={{
            clip: 'rect(0, auto, auto, 0)',
          }}
          className="absolute top-0 left-0 w-full h-full"
        >
          <HomeInfosBackground imageUid={cmsHome.home_info_background.filename_disk} />
        </div>
        <div className="triangle-bottom bg-light-100"></div>
        <h2 className="font-serif text-3xl text-center z-10 relative mt-16 sm:mt-8">Info clefs</h2>
        <div className="font-bold px-8 pt-8 pb-24 sm:pt-8 sm:pb-16 max-w-lg mx-auto space-y-4 z-10 relative">
          {cmsHome.home_info_text.split('\n').map((text, i) => (
            <InfoParagraph text={text} key={i} />
          ))}
          <Link href={routes().contactUs()} className="btn-primary mx-auto min-w-40 text-center">
            Contacter
          </Link>
        </div>
        <div className="triangle-top bg-white"></div>
      </div>
    </WithDecorativeDotsWrapper>
  );
}

function InfoParagraph({ text }: { text: string }) {
  const textArr = [] as ({ p: string } | { bold: string })[];

  let startOfElement = 0;
  let boldIsOpen = false;
  for (let i = 1; i < text.length; i++) {
    if (text[i] === '*') {
      if (!boldIsOpen) {
        textArr.push({ p: text.slice(startOfElement, i) });
        startOfElement = i + 1;
        boldIsOpen = true;
      } else {
        textArr.push({ bold: text.slice(startOfElement, i) });
        startOfElement = i + 1;
        boldIsOpen = false;
      }
    }
  }
  if (startOfElement < text.length) textArr.push({ p: text.slice(startOfElement, text.length) });

  return (
    <p>
      {textArr.map((element, i) => (
        <Fragment key={i}>
          {'p' in element ? element.p : <span className="text-primary-100">{element.bold}</span>}
        </Fragment>
      ))}
    </p>
  );
}
