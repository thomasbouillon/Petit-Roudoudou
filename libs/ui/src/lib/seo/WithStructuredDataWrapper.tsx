import { PropsWithChildren, HTMLProps } from 'react';
import { StructuedData } from './StructuredData';
import { StructuredDataProduct } from '@couture-next/types';

export function WithStructuedDataWrapper<
  AsData extends 'div' | undefined = undefined,
  TData extends StructuredDataProduct = StructuredDataProduct
>({
  as,
  stucturedData,
  children,
  ...props
}: PropsWithChildren<
  (AsData extends 'div'
    ? HTMLProps<HTMLDivElement> & { as: 'div' }
    : { as?: never }) & {
    stucturedData: TData;
  }
>) {
  if (as === 'div')
    return (
      <div {...props}>
        <StructuedData data={stucturedData} />
        {children}
      </div>
    );
  return (
    <>
      <StructuedData data={stucturedData} />
      {children}
    </>
  );
}
