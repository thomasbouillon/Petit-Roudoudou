import React, { PropsWithChildren, HTMLProps, forwardRef, ForwardedRef } from 'react';
import { StructuedData } from './StructuredData';
import { StructuredDataProduct } from '@couture-next/types';

export const WithStructuedDataWrapper = forwardRef(function WithStructuedDataWrapper<
  AsData extends React.ElementType = React.ElementType,
  TData extends StructuredDataProduct = StructuredDataProduct
>(
  {
    as,
    stucturedData,
    children,
    ...props
  }: PropsWithChildren<
    Omit<HTMLProps<AsData>, 'as'> & {
      as?: AsData;
      stucturedData: TData;
    }
  >,
  ref: ForwardedRef<HTMLElement>
) {
  const Component = as || React.Fragment;
  return (
    <Component {...props} {...{ ref }}>
      <StructuedData data={stucturedData} />
      {children}
    </Component>
  );
});
