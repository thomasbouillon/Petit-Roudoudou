import { StructuredDataProduct } from '@couture-next/types';
import { WithContext } from 'schema-dts';

export function StructuedData<
  TData extends StructuredDataProduct = StructuredDataProduct
>({ data }: { data: TData }) {
  return (
    <script
      key="structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          ...data,
          '@context': 'https://schema.org',
        } satisfies WithContext<TData>),
      }}
    />
  );
}
