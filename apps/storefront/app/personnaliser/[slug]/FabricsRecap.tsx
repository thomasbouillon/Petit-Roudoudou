import { useWatch } from 'react-hook-form';
import { AddToCartFormType } from './app';
import { CustomizableVariant } from '@prisma/client';
import { trpc } from 'apps/storefront/trpc-client';
import { useMemo } from 'react';

export default function FabricsRecap({
  backToEditing,
  customizableVariant,
}: {
  backToEditing: () => void;
  customizableVariant?: CustomizableVariant;
}) {
  const customizations = useWatch<AddToCartFormType, 'customizations'>({
    name: 'customizations',
  });

  const fabricIds = new Set(
    customizableVariant?.customizableParts.map(
      (customizablePart) => customizations[customizablePart.uid] as string | undefined
    )
  );
  fabricIds.delete(undefined);

  const fabricLabelsQuery = trpc.fabrics.findManyById.useQuery(Array.from(fabricIds) as string[], {
    select(fabrics) {
      return fabrics.reduce((acc, value) => {
        acc[value.id] = value.name;
        return acc;
      }, {} as Record<string, string>);
    },
  });

  return (
    <>
      {!!customizableVariant && (
        <div className="flex flex-col items-center mb-4">
          <ul className="">
            {customizableVariant.customizableParts.map((customizablePart) => (
              <li key={customizablePart.uid}>
                {customizablePart.label}:{' '}
                {customizations[customizablePart.uid]
                  ? fabricLabelsQuery.data?.[customizations[customizablePart.uid] as string]
                  : null}
              </li>
            ))}
          </ul>
        </div>
      )}
      <button type="button" className="btn-secondary mx-auto" onClick={backToEditing}>
        Modifier les tissus
      </button>
    </>
  );
}
