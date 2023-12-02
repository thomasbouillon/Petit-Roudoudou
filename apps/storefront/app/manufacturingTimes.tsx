'use client';

import { useQuery } from '@tanstack/react-query';
import {
  ManufacturingTimes as CmsManufacturingTimes,
  fetchFromCMS,
} from '../directus';

const unitTransalations = {
  days: 'jours',
  weeks: 'semaines',
  months: 'mois',
};

export default function ManufacturingTimes({
  className,
}: {
  className?: string;
}) {
  const cmsQuery = useQuery({
    queryKey: ['cms', 'manufacturing_times'],
    queryFn: () => fetchFromCMS<CmsManufacturingTimes>('manufacturing_times'),
  });

  if (cmsQuery.error) throw cmsQuery.error;
  if (cmsQuery.isPending)
    return (
      <p>
        <span className="sr-only">
          Récupération des délais de confection...
        </span>
      </p>
    );

  if (
    cmsQuery.data.text.includes('{min}') &&
    cmsQuery.data.text.includes('{max}') &&
    cmsQuery.data.text.includes('{unit}')
  ) {
    return (
      <p className={className}>
        {cmsQuery.data.text
          .replace('{min}', cmsQuery.data.min.toString())
          .replace('{max}', cmsQuery.data.max.toString())
          .replace('{unit}', unitTransalations[cmsQuery.data.unit])}
      </p>
    );
  } else {
    return <p>{cmsQuery.data.text}</p>;
  }
}
