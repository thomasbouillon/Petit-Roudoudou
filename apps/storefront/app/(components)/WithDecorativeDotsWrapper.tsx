import clsx from 'clsx';
import Image from 'next/image';
import { PropsWithChildren } from 'react';
import DecorativeDotsImage from './decorative-dots.png';

type DotsPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

type Props = PropsWithChildren<{
  className?: string;
  dotsPosition: DotsPosition | DotsPosition[];
  dotsClassName?: string;
  autoPadding?: boolean;
}>;

export function WithDecorativeDotsWrapper({ className, children, dotsPosition, dotsClassName, autoPadding }: Props) {
  dotsPosition = Array.isArray(dotsPosition) ? [...dotsPosition] : dotsPosition;
  const currentDotsPosition = Array.isArray(dotsPosition) ? dotsPosition.pop() : dotsPosition;
  const dotsYPosition = currentDotsPosition === 'top-right' || currentDotsPosition === 'top-left' ? 'top' : 'bottom';
  const dotsXPosition =
    currentDotsPosition === 'top-right' || currentDotsPosition === 'bottom-right' ? 'right' : 'left';

  return (
    <div
      className={clsx(
        !(Array.isArray(dotsPosition) && dotsPosition.length) && className,
        'relative overflow-hidden',
        autoPadding && dotsYPosition === 'top' && 'pt-16',
        autoPadding && dotsYPosition === 'bottom' && 'pb-16'
      )}
    >
      {Array.isArray(dotsPosition) && dotsPosition.length > 0 ? (
        <WithDecorativeDotsWrapper
          dotsPosition={dotsPosition}
          children={children}
          className={className}
          dotsClassName={dotsClassName}
          autoPadding={autoPadding}
        />
      ) : (
        children
      )}
      <Image
        src={DecorativeDotsImage}
        width={194}
        height={230}
        className={clsx(
          'absolute object-contain pointer-events-none scale-50 sm:scale-75 -rotate-45',
          dotsYPosition === 'top' && 'top-0 -translate-y-8',
          dotsYPosition === 'bottom' && 'bottom-0',
          dotsXPosition === 'right' && 'right-0 translate-x-1/2',
          dotsXPosition === 'left' && 'left-0 -translate-x-1/2',
          dotsClassName
        )}
        alt="Decorative orange dots"
      />
    </div>
  );
}
