'use client';

import clsx from 'clsx';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Home } from '../directus';
import { CmsImage } from './cmsImage';

const AUTOSWIPE_TIMEOUT = 4500;

let timeoutId: NodeJS.Timeout;
let animateRef: number;

type Props = {
  news: Home['news'];
};

export default function NewsCarousel({ news }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

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
                'absolute top-1/2 -translate-y-1/2 left-2 md:left-4 z-10 max-w-60 p-2',
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
            <div className="relative aspect-[2/1] sm:aspect-[5/1]">
              <CmsImage
                src={pieceOfNews.image.filename_disk}
                srcDesktop={pieceOfNews.imageDesktop?.filename_disk}
                desktopBreakCssMediaCondition="(min-width: 640px)"
                alt={pieceOfNews.imageAlt}
                fill
                priority={i === 0}
                className="object-center object-cover"
              />
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
              onClick={() => (carouselRef.current ? scrollToIndex(carouselRef.current, index, news.length) : undefined)}
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

function scrollToIndex(element: HTMLDivElement, index: number, length: number) {
  element.scrollTo({
    left: ((index * element.scrollWidth) / length) * index,
    behavior: 'smooth',
  });
}
