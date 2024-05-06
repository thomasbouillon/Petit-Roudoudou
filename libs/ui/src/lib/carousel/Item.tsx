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
  return (
    <As className={clsx(className, 'snap-start shrink-0 grow-0 basis-[calc(50%-0.5rem)] sm:basis-64')}>{children}</As>
  );
}
