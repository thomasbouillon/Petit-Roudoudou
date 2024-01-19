import React, { PropsWithChildren, HTMLProps, forwardRef, ForwardedRef } from 'react';
import { StructuedData } from './StructuredData';
import { Thing } from 'schema-dts';

export const WithStructuedDataWrapper = forwardRef(function WithStructuedDataWrapper<
  AsData extends React.ElementType = React.ElementType,
  TData extends Exclude<Thing, string> = Exclude<Thing, string>
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
