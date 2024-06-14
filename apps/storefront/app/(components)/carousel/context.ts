import React from 'react';

type CarouselContextValue = {
  itemsRef: React.MutableRefObject<HTMLElement | null>;
};

export const CarouselContext = React.createContext<CarouselContextValue | null>(null);

export const useCarousel = () => {
  const context = React.useContext(CarouselContext);
  if (!context) {
    throw new Error('useCarouselContext must be used within a CarouselProvider');
  }
  return context;
};
