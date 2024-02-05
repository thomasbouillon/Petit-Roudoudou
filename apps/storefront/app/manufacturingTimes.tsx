'use client';

import { useQuery } from '@tanstack/react-query';
import { ManufacturingTimes as CmsManufacturingTimes, fetchFromCMS } from '../directus';
import React from 'react';

const unitTransalations = {
  days: 'jours',
  weeks: 'semaines',
  months: 'mois',
};

export default function ManufacturingTimes({
  className,
  variant = 'text',
  as,
}: {
  as?: React.ElementType;
  className?: string;
  variant?: 'max-delay-with-unit' | 'text';
}) {
  const Component = as ?? 'p';

  const cmsQuery = useQuery({
    queryKey: ['cms', 'manufacturing_times'],
    queryFn: () => fetchFromCMS<CmsManufacturingTimes>('manufacturing_times'),
  });

  const componentProps = { className };
  if (as === React.Fragment) delete componentProps.className;

  if (cmsQuery.error) throw cmsQuery.error;
  if (cmsQuery.isPending)
    return (
      <Component {...componentProps}>
        <span className="text-transparent">Récupération des délais de confection...</span>
      </Component>
    );

  if (variant === 'max-delay-with-unit')
    return (
      <Component {...componentProps}>
        {cmsQuery.data.max} {unitTransalations[cmsQuery.data.unit]}
      </Component>
    );

  if (
    cmsQuery.data.text.includes('{min}') &&
    cmsQuery.data.text.includes('{max}') &&
    cmsQuery.data.text.includes('{unit}')
  ) {
    return (
      <Component {...componentProps}>
        {cmsQuery.data.text
          .replace('{min}', cmsQuery.data.min.toString())
          .replace('{max}', cmsQuery.data.max.toString())
          .replace('{unit}', unitTransalations[cmsQuery.data.unit])}
      </Component>
    );
  } else {
    return <p {...componentProps}>{cmsQuery.data.text}</p>;
  }
}
