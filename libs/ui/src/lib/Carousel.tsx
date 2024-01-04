'use client';
import clsx from 'clsx';
import Image, { ImageLoader } from 'next/image';
import { useState, useEffect, useRef } from 'react';

type Image = {
  url: string;
  alt: string;
  placeholderDataUrl?: string;
};

type Props = {
  images: Image[];
  loader?: ImageLoader;
};

export const Carousel = ({ images, loader }: Props) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animateRef, setAnimateRef] = useState(-1);

  const calcCurrentIndex = () => {
    if (!carouselRef.current) return;
    setCurrentIndex(
      Math.round(
        ((carouselRef.current.scrollLeft || 0) / (carouselRef.current.scrollWidth - carouselRef.current.clientWidth)) *
          (images.length - 1)
      )
    );
  };

  useEffect(() => {
    const handleScroll = () => {
      if (animateRef !== -1) window.cancelAnimationFrame(animateRef);

      if (window.requestAnimationFrame === undefined) calcCurrentIndex();
      else setAnimateRef(window.requestAnimationFrame(calcCurrentIndex));
    };

    if (carouselRef.current) {
      carouselRef.current.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (carouselRef.current) {
        carouselRef.current.removeEventListener('scroll', handleScroll);
      }
    };
  }, [images, carouselRef]);

  const goTo = (index: number) => () => {
    if (!carouselRef.current) return;
    const target = carouselRef.current.children[index];
    if (!target) return;
    const rect = target.getBoundingClientRect();

    carouselRef.current.scrollTo({
      left: rect.left + carouselRef.current.scrollLeft + rect.width / 2 - carouselRef.current.clientWidth / 2,
      behavior: 'smooth',
    });
  };

  return (
    <div>
      <div
        className="overflow-x-scroll md:!px-4 scroll-snap flex flex-row md:gap-2"
        style={{
          paddingLeft: 'calc((100% - 18rem) / 2)',
          paddingRight: 'calc((100% - 18rem) / 2)',
        }}
        ref={carouselRef}
      >
        {images.map((image, index) => (
          <div key={index} className="w-72 basis-72 h-72 shrink-0 relative">
            <Image
              src={image.url}
              alt={image.alt}
              width={288}
              height={288}
              placeholder={image.placeholderDataUrl ? 'blur' : 'empty'}
              blurDataURL={image.placeholderDataUrl}
              loader={loader}
              className={clsx(
                'object-contain absolute inset-0 w-full h-full transition-transform transform-gpu',
                index !== currentIndex && 'scale-[0.8] opacity-60 md:opacity-100 md:scale-100'
              )}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-center mt-2">
        {images.map((_, index) => (
          <div className="p-1 cursor-pointer" onClick={goTo(index)} key={index}>
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
};
