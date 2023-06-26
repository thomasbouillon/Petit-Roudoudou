'use client';
import clsx from 'clsx';
import Image from 'next/image';
import React, { useEffect, useRef, useState } from 'react';
import useIsMobile from '../hooks/useIsMobile';

type News = {
  title: string;
  image: string;
  imageDescktop?: string;
  imageAlt: string;
  href?: string;
};

type Props = { news: News[] };

const AUTOSWIPE_TIMEOUT = 3000;

let timeoutId: NodeJS.Timeout;
let animateRef: number;

export default function News({ news }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const prepareTimeout = (next: number) => {
    if (typeof window === 'undefined') return;
    timeoutId = setTimeout(() => {
      if (!carouselRef.current) return;
      scrollToIndex(carouselRef.current, next, news.length);
      prepareTimeout((next + 1) % news.length);
    }, AUTOSWIPE_TIMEOUT);
  };

  useEffect(() => {
    if (typeof window === 'undefined' || !carouselRef.current) return;

    const handler = () => {
      if (!carouselRef.current) return;
      const index = Math.round(
        ((carouselRef.current?.scrollLeft || 0) /
          (carouselRef.current?.scrollWidth -
            carouselRef.current.clientWidth)) *
          (news.length - 1)
      );

      setCurrentIndex(index);
      clearTimeout(timeoutId);
      prepareTimeout((index + 1) % news.length);
      animateRef = -1;
    };

    const requestHandler = () => {
      if (animateRef !== -1) window.cancelAnimationFrame(animateRef);
      if (window.requestAnimationFrame)
        animateRef = window.requestAnimationFrame(handler);
      else handler();
    };

    handler();

    carouselRef.current.addEventListener('scroll', requestHandler);
    const prevCarouselRef = carouselRef.current;

    return () => {
      if (animateRef !== -1) window.cancelAnimationFrame(animateRef);
      prevCarouselRef.removeEventListener('scroll', requestHandler);
    };
  }, [carouselRef, setCurrentIndex]);

  useEffect(() => {
    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div>
      <h2 className="sr-only">Nouveautés</h2>
      <div
        className="flex overflow-x-scroll w-full scroll-snap"
        ref={carouselRef}
      >
        {news.map((pieceOfNews) => (
          <div className="relative basis-full shrink-0" key={pieceOfNews.title}>
            <div className="absolute top-1/2 -translate-y-1/2 left-3 bg-primary-100 w-28 py-2 z-10">
              <h3 className="text-white text-center font-semibold">
                {pieceOfNews.title.split('\n').map((txt, index) => (
                  <React.Fragment key={index}>
                    {txt}
                    <br className="block h-4" />
                  </React.Fragment>
                ))}
              </h3>
            </div>
            <div className="relative aspect-12/5 h-52">
              <Image
                fill
                src={
                  isMobile || !pieceOfNews.imageDescktop
                    ? pieceOfNews.image
                    : pieceOfNews.imageDescktop
                }
                alt={pieceOfNews.imageAlt}
                className="object-center object-cover"
              />
            </div>
          </div>
        ))}
      </div>
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
    </div>
  );
}

function scrollToIndex(element: HTMLDivElement, index: number, length: number) {
  element.scrollTo({
    left: ((index * element.scrollWidth) / length) * index,
    behavior: 'smooth',
  });
}
