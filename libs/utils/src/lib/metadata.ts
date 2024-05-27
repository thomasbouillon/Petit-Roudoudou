import type { Metadata } from 'next';

export function generateMetadata(meta: Metadata): Metadata {
  if (meta.title) meta.title = `${meta.title} | Petit Roudoudou`;
  if (!meta.title) meta.title = 'Petit Roudoudou';

  if (!meta.openGraph) meta.openGraph = {};

  if (!meta.openGraph.title) meta.openGraph.title = meta.title;
  meta.openGraph.title = `${meta.openGraph.title} | Petit Roudoudou`;

  if (meta.description && !meta.openGraph.description) meta.openGraph.description = meta.description;

  return meta;
}
