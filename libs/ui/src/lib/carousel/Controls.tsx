'use client';

import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { useCarousel } from './context';
import { useCallback, useEffect, useMemo, useState } from 'react';

export function Controls({ className }: { className?: string }) {
  const { itemsRef } = useCarousel();
  const [canGoToPrev, setCanGoToPrev] = useState(false);
  const [canGoToNext, setCanGoToNext] = useState(false);

  const prev = useCallback(() => {
    if (!itemsRef.current) return;
    // Assuming all carousel items have the same width
    const itemWidth = itemsRef.current.children[0].clientWidth;
    itemsRef.current.scrollLeft -= itemWidth;
  }, []);

  const next = useCallback(() => {
    if (!itemsRef.current) return;
    const itemWidth = itemsRef.current.children[0].clientWidth;
    itemsRef.current.scrollLeft += itemWidth;
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!itemsRef.current) return;
      setCanGoToPrev(itemsRef.current.scrollLeft > 0);
      setCanGoToNext(itemsRef.current.scrollLeft < itemsRef.current.scrollWidth - itemsRef.current.clientWidth);
    };

    if (itemsRef.current) {
      itemsRef.current.addEventListener('scroll', handleScroll);
      handleScroll();
    }

    return () => {
      if (!itemsRef.current) return;
      itemsRef.current.removeEventListener('scroll', handleScroll);
    };
  }, [itemsRef.current]);

  // Hide controls if there is no need to scroll
  const showControls = useMemo(() => canGoToPrev || canGoToNext, [canGoToPrev, canGoToNext]);
  if (!showControls) return null;

  return (
    <div className={clsx('flex items-center gap-2 empty:hidden', className)}>
      <button
        className={clsx('rounded-full bg-gray-100 p-2', !canGoToPrev && 'opacity-50')}
        type="button"
        onClick={prev}
        aria-hidden
        tabIndex={-1}
        disabled={!canGoToPrev}
        suppressHydrationWarning
      >
        <ChevronLeftIcon className="w-6 h-6" />
      </button>
      <button
        className={clsx('rounded-full bg-gray-100 p-2', !canGoToNext && 'opacity-50')}
        type="button"
        onClick={next}
        aria-hidden
        tabIndex={-1}
        disabled={!canGoToNext}
        suppressHydrationWarning
      >
        <ChevronRightIcon className="w-6 h-6" />
      </button>
    </div>
  );
}
