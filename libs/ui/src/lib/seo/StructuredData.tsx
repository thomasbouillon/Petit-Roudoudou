import { WithContext, Thing } from 'schema-dts';

export function StructuedData<TData extends Thing = Thing>({ data }: { data: TData }) {
  return (
    <script
      key="structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          ...(data as any),
          '@context': 'https://schema.org',
        } satisfies WithContext<TData>),
      }}
    />
  );
}
