'use client';

import clsx from 'clsx';
import React from 'react';
import { useCarousel } from './context';

export function Items({
  children,
  as,
  className,
}: {
  children: React.ReactNode;
  as?: React.ElementType;
  className: string;
}) {
  const As = as ?? 'ul';
  const { itemsRef } = useCarousel();

  return (
    <As
      className={clsx(
        'scroll-smooth snap-x snap-mandatory flex overflow-x-scroll gap-2 scroll-p-3 sm:gap-8 md:scroll-p-4',
        className
      )}
      ref={itemsRef}
    >
      {children}
    </As>
  );
}
