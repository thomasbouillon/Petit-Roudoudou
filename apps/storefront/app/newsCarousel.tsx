'use client';

import clsx from 'clsx';
import Image, { getImageProps } from 'next/image';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import useIsMobile from '../hooks/useIsMobile';
import { loader } from '../utils/next-image-directus-loader';
import Link from 'next/link';
import { Home } from '../directus';

const AUTOSWIPE_TIMEOUT = 3000;

let timeoutId: NodeJS.Timeout;
let animateRef: number;

type Props = {
  news: Home['news'];
};

export default function NewsCarousel({ news }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  // const isMobile = useIsMobile(isMobileDefault ?? true);

  const prepareTimeout = useCallback(
    (next: number) => {
      if (typeof window === 'undefined') return;
      timeoutId = setTimeout(() => {
        if (!carouselRef.current) return;
        scrollToIndex(carouselRef.current, next, news.length);
        prepareTimeout((next + 1) % news.length);
      }, AUTOSWIPE_TIMEOUT);
    },
    [news]
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !carouselRef.current || news === undefined || news.length <= 1) return;

    const handler = () => {
      if (!carouselRef.current) return;
      const index = Math.round(
        ((carouselRef.current?.scrollLeft || 0) /
          (carouselRef.current?.scrollWidth - carouselRef.current.clientWidth)) *
          (news.length - 1)
      );

      setCurrentIndex(index);
      clearTimeout(timeoutId);
      prepareTimeout((index + 1) % news.length);
      animateRef = -1;
    };

    const requestHandler = () => {
      if (animateRef !== -1) window.cancelAnimationFrame(animateRef);
      if (window.requestAnimationFrame) animateRef = window.requestAnimationFrame(handler);
      else handler();
    };

    handler();

    carouselRef.current.addEventListener('scroll', requestHandler);
    const prevCarouselRef = carouselRef.current;

    return () => {
      if (animateRef !== -1) window.cancelAnimationFrame(animateRef);
      prevCarouselRef.removeEventListener('scroll', requestHandler);
    };
  }, [carouselRef, setCurrentIndex, news, prepareTimeout]);

  useEffect(() => {
    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  const renderNewsTitle = (title: string) =>
    title.split('\n').map((txt, index) => (
      <React.Fragment key={index}>
        {index > 0 && <br className="block h-4" />}
        {txt}
      </React.Fragment>
    ));

  return (
    <>
      <div className="flex overflow-x-scroll w-full scroll-snap" ref={carouselRef}>
        {news.map((pieceOfNews, i) => (
          <div className="relative basis-full shrink-0" key={pieceOfNews.title}>
            <div
              className={clsx(
                'absolute top-1/2 -translate-y-1/2 left-2 md:left-4 z-10',
                'rounded-sm bg-primary-100 shadow-neomorphism',
                pieceOfNews.hideTitle && 'sr-only'
              )}
            >
              <h3 className="text-white text-center font-semibold my-2">
                {pieceOfNews.href ? (
                  <Link href={pieceOfNews.href} className="block cursor-pointer w-44 p-4">
                    {renderNewsTitle(pieceOfNews.title)}
                  </Link>
                ) : (
                  renderNewsTitle(pieceOfNews.title)
                )}
              </h3>
            </div>
            <div className="relative aspect-[3/2] sm:aspect-[4/1]">
              <PieceOfNewsImage pieceOfNewsIndex={i} pieceOfNews={pieceOfNews} />
            </div>
          </div>
        ))}
      </div>
      {news.length > 1 && (
        <div className="flex justify-center mt-2 gap-1">
          {news.map((_, index) => (
            <div
              className="p-1 cursor-pointer"
              key={index}
              // onClick={goTo(index)} key={index}
            >
              <div
                className={clsx(
                  'w-2 h-2 bg-secondary-900 rounded-full transition-transform transform-gpu',
                  index !== currentIndex && 'opacity-25 scale-75'
                )}
              ></div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

type PieceOfNewsImageProps = { pieceOfNewsIndex: number; pieceOfNews: Home['news'][0] };
function PieceOfNewsImage({ pieceOfNewsIndex, pieceOfNews }: PieceOfNewsImageProps) {
  const { srcSet: desktopImgSrcSet } = pieceOfNews.imageDesktop
    ? getImageProps({
        fill: true,
        src: pieceOfNews.imageDesktop.filename_disk,
        alt: pieceOfNews.imageAlt,
        loader: loader,
        priority: pieceOfNewsIndex === 0,
        sizes: '100vw',
      }).props
    : { srcSet: null };

  const { srcSet: mobileImgSrcSet, ...restOfImgProps } = getImageProps({
    fill: true,
    src: pieceOfNews.image.filename_disk,
    alt: pieceOfNews.imageAlt,
    loader: loader,
    priority: pieceOfNewsIndex === 0,
    sizes: '100vw',
  }).props;

  return (
    <picture>
      {!!desktopImgSrcSet && <source srcSet={desktopImgSrcSet} media="(min-width: 640px)" />}
      <source srcSet={mobileImgSrcSet} media="(min-width: 0px)" />
      <img {...restOfImgProps} className="object-center object-cover" />
    </picture>
  );
}

function scrollToIndex(element: HTMLDivElement, index: number, length: number) {
  element.scrollTo({
    left: ((index * element.scrollWidth) / length) * index,
    behavior: 'smooth',
  });
}
