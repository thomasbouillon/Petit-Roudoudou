import type { Metadata } from 'next';

export function generateMetadata(meta: Metadata): Metadata {
  if (meta.title) meta.title = `${meta.title} | Petit Roudoudou`;

  if (!meta.openGraph) meta.openGraph = {};

  if (meta.title && !meta.openGraph.title) meta.openGraph.title = meta.title;

  if (meta.description && !meta.openGraph.description)
    meta.openGraph.description = meta.description;

  return meta;
}
