'use client';

import Link from 'next/link';
import { routes } from '@couture-next/routing';
import Image from 'next/image';
import React, { useMemo } from 'react';
import { Fabric } from '@prisma/client';
import { loader } from 'apps/storefront/utils/next-image-firebase-storage-loader';
import { trpc } from 'apps/storefront/trpc-client';

export default function Page() {
  const { data: fabrics, error } = trpc.fabrics.list.useQuery();
  if (error) throw error;

  const groupsQuery = trpc.fabricGroups.list.useQuery(undefined, {
    select: (groups) => groups.concat({ id: 'others', name: 'Autres', fabricIds: [] }),
  });
  if (groupsQuery.isError) throw groupsQuery.error;

  const groupedFabrics = useMemo(
    () =>
      fabrics?.reduce((acc, fab) => {
        fab.groupIds.forEach((groupId) => {
          if (acc[groupId] === undefined) acc[groupId] = [fab];
          else acc[groupId].push(fab);
        });
        if (fab.groupIds.length === 0) {
          if (acc['others'] === undefined) acc['others'] = [fab];
          else acc['others'].push(fab);
        }
        return acc;
      }, {} as Record<string, Fabric[]>) ?? {},
    [fabrics]
  );

  if (fabrics === undefined || groupsQuery.isPending === undefined) return <div>Loading...</div>;

  const groupLabelFromId = (id: string) => groupsQuery.data?.find((g) => g.id === id)?.name ?? '';

  return (
    <div>
      <h1 className="text-3xl font-serif text-center mb-8">Tissus</h1>
      <Link href={routes().admin().fabrics().new()} className="btn-primary text-center mx-auto">
        Ajouter un tissu
      </Link>
      <div className="grid grid-cols-[repeat(auto-fill,28rem)] mt-8 place-content-center items-start gap-4">
        {Object.entries(groupedFabrics).map(([groupId, fabrics]) => (
          <FabricList fabrics={fabrics} title={groupLabelFromId(groupId)} />
        ))}
      </div>
    </div>
  );
}

const FabricList: React.FC<{ fabrics: Fabric[]; title: string }> = ({ fabrics, title }) => {
  return (
    <div className="border rounded-md shadow-md max-w-md pb-8">
      <h2 className="p-2 font-serif text-2xl text-center border-b">{title}</h2>
      <ul>
        {fabrics.map((fabric) => (
          <li key={fabric.id} className="border-b">
            <Link
              className="px-8 flex items-center gap-8 py-2"
              href={routes().admin().fabrics().fabric(fabric.id).edit()}
            >
              <Image
                src={(fabric.previewImage ?? fabric.image).url}
                alt=""
                width={64}
                height={64}
                className="w-16 h-16 object-cover"
                blurDataURL={(fabric.previewImage ?? fabric.image).placeholderDataUrl ?? undefined}
                placeholder={(fabric.previewImage ?? fabric.image).placeholderDataUrl ? 'blur' : undefined}
                loader={loader}
              />
              <p>{fabric.name}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};
