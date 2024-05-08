import clsx from 'clsx';
import React, { useMemo } from 'react';

export function Item({
  children,
  className,
  as,
}: {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}) {
  const As = as ?? 'li';

  const smbasis = useMemo(
    () =>
      className
        ?.split(' ')
        .filter((className) => className.startsWith('sm:basis'))
        .join(' ') || 'sm:basis-64',
    [className]
  );

  const basis = useMemo(
    () =>
      className
        ?.split(' ')
        .filter((className) => className.startsWith('basis'))
        .join(' ') || 'basis-[calc(50%-0.5rem)]',
    [className]
  );

  const classNameWithoutBasis = useMemo(
    () =>
      className
        ?.split(' ')
        .filter((className) => !className.startsWith('basis') && !className.startsWith('sm:basis'))
        .join(' '),
    [className]
  );

  return <As className={clsx(classNameWithoutBasis, smbasis, basis, 'snap-start shrink-0 grow-0')}>{children}</As>;
}
