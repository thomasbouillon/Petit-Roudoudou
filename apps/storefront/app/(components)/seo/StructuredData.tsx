import { Thing } from 'schema-dts';
import { jsonLdScriptProps } from 'react-schemaorg';

export function StructuedData<TData extends Exclude<Thing, string> = Exclude<Thing, string>>({
  data,
}: {
  data: TData;
}) {
  return (
    <script
      {...jsonLdScriptProps({
        ...data,
        '@context': 'https://schema.org',
      })}
    />
  );
}
