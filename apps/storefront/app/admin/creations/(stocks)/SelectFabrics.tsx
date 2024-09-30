import { Spinner } from '@couture-next/ui/Spinner';
import { CheckIcon } from '@heroicons/react/24/solid';
import { trpc } from 'apps/storefront/trpc-client';
import Image from 'next/image';
import { Fragment, useCallback, useEffect, useMemo } from 'react';

import { Popover, PopoverButton, PopoverPanel, Radio, RadioGroup } from '@headlessui/react';
import { ArticleFormType } from '../form';
import { useController, useFormContext, useWatch } from 'react-hook-form';
import { loader } from 'apps/storefront/utils/next-image-firebase-storage-loader';
import { Fabric } from '@prisma/client';
import clsx from 'clsx';

type Props = {
  className?: string;
  controlKey: `stocks.${number}.fabricIds`;
};

export default function SelectFabrics({ controlKey, className }: Props) {
  const stockIndex = parseInt(controlKey.split('.')[1]);

  const skuUid = useWatch<ArticleFormType, `stocks.${number}.sku`>({
    name: `stocks.${stockIndex}.sku`,
  });

  const skus = useWatch<ArticleFormType, 'skus'>({
    name: 'skus',
  });

  const linkedSkuVariantUid = useMemo(() => skus.find((sku) => sku.uid === skuUid), [skuUid, skus]);

  const customizableVariants = useWatch<ArticleFormType, 'customizableVariants'>({
    name: 'customizableVariants',
  });

  const linkedCustomizableVariant = useMemo(
    () => customizableVariants.find((variant) => variant.uid === linkedSkuVariantUid?.customizableVariantUid),
    [linkedSkuVariantUid, customizableVariants]
  );

  const fabricGroupIds = useMemo(
    () => Array.from(new Set(linkedCustomizableVariant?.customizableParts.map((p) => p.fabricListId) ?? [])),
    [linkedCustomizableVariant]
  );

  const fabricsByGroupQuery = trpc.fabrics.findByGroups.useQuery(
    {
      groupIds: fabricGroupIds,
    },
    {
      enabled: fabricGroupIds.length > 0,
      select: (fabrics) =>
        fabrics.reduce((acc, fabric) => {
          fabric.groupIds.forEach((groupId) => {
            if (acc[groupId] === undefined) acc[groupId] = [fabric];
            else acc[groupId].push(fabric);
          });
          return acc;
        }, {} as Record<string, Fabric[]>),
    }
  );

  const { field, fieldState } = useController<ArticleFormType, `stocks.${number}.fabricIds`>({
    name: controlKey,
  });

  useEffect(() => {
    // Sync list size with customizable parts count in the linked 3D model
    if (field.value === undefined) {
      field.onChange(fabricGroupIds.map(() => ''));
    } else if (field.value.length < fabricGroupIds.length) {
      const missingValues = new Array(fabricGroupIds.length - field.value.length).fill('');
      field.onChange(field.value.concat(missingValues));
    } else if (field.value.length > fabricGroupIds.length) {
      field.onChange(field.value.slice(0, fabricGroupIds.length));
    }
  }, [field.value?.length, fabricGroupIds]);

  const onChange = useCallback(
    (value: string, index: number) => {
      field.onChange(field.value.map((v, i) => (i === index ? value : v)));
    },
    [field.onChange, field.value]
  );

  if (fabricsByGroupQuery.isError) throw fabricsByGroupQuery.error;
  if (fabricsByGroupQuery.isFetching) return <Spinner className="w-6 h-6" />;

  if (fabricGroupIds.length === 0 || fabricsByGroupQuery.data === undefined)
    return <p>Le modèle 3D associé à ce stock (via le SKU) n'est lié à aucun groupe de tissus.</p>;

  return (
    <div className={clsx(className, 'grid grid-cols-[auto_1fr] gap-4 items-center')}>
      {linkedCustomizableVariant?.customizableParts.map((customizablePart, index) => (
        <Fragment key={customizablePart.uid}>
          <p>{customizablePart.label}:</p>
          <FabricSelector
            key={index}
            className={className}
            value={field.value[index]}
            onChange={(value) => onChange(value, index)}
            controlKey={controlKey}
            fabrics={fabricsByGroupQuery.data[customizablePart.fabricListId]}
          />
        </Fragment>
      ))}
      {<p className="col-span-2 empty:hidden text-red-500">{!!fieldState.error && 'Requis'}</p>}
    </div>
  );
}

function FabricSelector({
  className,
  fabrics,
  value,
  onChange,
}: Props & {
  fabrics: Fabric[];
  value?: string;
  onChange: (value: string) => void;
}) {
  const selectedFabric = fabrics.find((fabric) => fabric.id === value);

  return (
    <Popover>
      <PopoverButton className={className}>
        {selectedFabric ? (
          <div className="flex items-center gap-4">
            <Image
              alt=""
              src={selectedFabric.image.url}
              loader={loader}
              width={64}
              height={64}
              className="w-8 h-8 object-cover object-center"
              placeholder={selectedFabric.image.placeholderDataUrl ? 'blur' : undefined}
              blurDataURL={selectedFabric.image.placeholderDataUrl ?? undefined}
            />
            {selectedFabric.name}
          </div>
        ) : (
          'Choisir un tissu'
        )}
      </PopoverButton>
      <PopoverPanel anchor="bottom" className="[--anchor-max-height:min(20rem,20vh)] shadow-lg">
        <RadioGroup value={value} onChange={onChange} className="bg-white grid grid-cols-3 p-2">
          {fabrics.map((fabric) => (
            <Radio
              key={fabric.id}
              value={fabric.id}
              className="p-2 flex flex-col items-center data-[checked]:outline !outline-2 !outline-primary-100 data-[checked]:text-primary-100 group list-none max-w-32 text-center"
            >
              <Image
                alt=""
                src={fabric.image.url}
                loader={loader}
                width={64}
                height={64}
                className="w-16 h-16 object-cover object-center"
                placeholder={fabric.image.placeholderDataUrl ? 'blur' : undefined}
                blurDataURL={fabric.image.placeholderDataUrl ?? undefined}
              />
              {fabric.name}
              <CheckIcon className="group-data-[selected]:visible invisible w-4 h-4" />
            </Radio>
          ))}
        </RadioGroup>
      </PopoverPanel>
    </Popover>
  );
}
