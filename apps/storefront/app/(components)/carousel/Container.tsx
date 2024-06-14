'use client';

import React from 'react';
import { CarouselContext } from './context';

type ContainerProps =
  | {
      children: React.ReactNode;
      as?: typeof React.Fragment;
      className?: never;
    }
  | {
      children: React.ReactNode;
      as: React.ElementType;
      className?: string;
    };

export function Container({ children, as, className }: ContainerProps) {
  const itemsRef = React.useRef<HTMLUListElement>(null);
  const As = as ?? React.Fragment;
  return (
    <CarouselContext.Provider value={{ itemsRef }}>
      <As className={className}>{children}</As>
    </CarouselContext.Provider>
  );
}
