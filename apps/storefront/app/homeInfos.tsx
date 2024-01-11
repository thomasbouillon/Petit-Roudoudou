'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { Home, fetchFromCMS } from '../directus';
import { loader } from '../utils/next-image-directus-loader';
import Link from 'next/link';
import { routes } from '@couture-next/routing';
import { Fragment } from 'react';

export function HomeInfos() {
  const getCMSLinksQuery = useSuspenseQuery({
    queryKey: ['cms', 'home'],
    queryFn: () => fetchFromCMS<Home>('home', { fields: '*.*.*' }),
  });

  if (getCMSLinksQuery.isError) throw getCMSLinksQuery.error;

  return (
    <div className="bg-gray-200 relative">
      <div
        style={{
          backgroundImage: `url("${loader({
            src: getCMSLinksQuery.data.home_info_background.filename_disk,
            width: 512,
          })}")`,
          backgroundAttachment: 'fixed',
        }}
        className="bg-no-repeat bg-center bg-cover opacity-30 absolute inset-0"
      ></div>
      <div className="triangle-bottom bg-light-100"></div>
      <div className="font-bold px-8 py-40 max-w-sm mx-auto space-y-4 z-10 relative">
        {getCMSLinksQuery.data.home_info_text.split('\n').map((text, i) => (
          <InfoParagraph text={text} key={i} />
        ))}
        <Link href={routes().contactUs()} className="btn-primary mx-auto min-w-40 text-center">
          Contacter
        </Link>
      </div>
      <div className="triangle-top bg-light-100"></div>
    </div>
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
