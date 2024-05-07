import clsx from 'clsx';
import React from 'react';

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

  const smbasis =
    className
      ?.split(' ')
      .filter((className) => className.startsWith('sm:basis') !== null)
      .join(' ') || ' sm:basis-64';
  const basis =
    className
      ?.split(' ')
      .filter((className) => className.startsWith('basis') !== null)
      .join(' ') || 'basis-[calc(50%-0.5rem)]';

  return <As className={clsx(className, smbasis, basis, 'snap-start shrink-0 grow-0')}>{children}</As>;
}
