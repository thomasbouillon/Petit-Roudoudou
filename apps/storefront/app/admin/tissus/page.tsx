'use client';

import { useQuery } from '@tanstack/react-query';
import useDatabase from '../../../hooks/useDatabase';
import { collection, getDocs, query } from 'firebase/firestore';
import { Fabric, FabricGroup } from '@couture-next/types';
import Link from 'next/link';
import { firestoreConverterAddRemoveId } from '@couture-next/utils';
import { routes } from '@couture-next/routing';
import Image from 'next/image';
import React, { useMemo } from 'react';

export default function Page() {
  const database = useDatabase();

  const { data: fabrics, error } = useQuery({
    queryKey: ['fabrics.all'],
    queryFn: () =>
      getDocs(collection(database, 'fabrics').withConverter(firestoreConverterAddRemoveId<Fabric>())).then((snapshot) =>
        snapshot.docs.map((doc) => doc.data())
      ),
  });
  if (error) throw error;

  const groupsQuery = useQuery({
    queryKey: ['fabricGroups'],
    queryFn: () =>
      getDocs(collection(database, 'fabricGroups').withConverter(firestoreConverterAddRemoveId<FabricGroup>())).then(
        (snap) => snap.docs.map((d) => d.data())
      ),
  });
  if (groupsQuery.isError) throw groupsQuery.error;

  const groupedFabrics = useMemo(
    () =>
      fabrics?.reduce((acc, fab) => {
        fab.groupIds.forEach((groupId) => {
          if (acc[groupId] === undefined) acc[groupId] = [fab];
          else acc[groupId].push(fab);
        });
        return acc;
      }, {} as Record<string, Fabric[]>) ?? {},
    [fabrics]
  );

  if (fabrics === undefined || groupsQuery.isPending === undefined) return <div>Loading...</div>;

  const groupLabelFromId = (id: string) => groupsQuery.data?.find((g) => g._id === id)?.name ?? '';

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
          <li key={fabric._id} className="border-b">
            <Link
              className="px-8 flex items-center gap-8 py-2"
              href={routes().admin().fabrics().fabric(fabric._id).edit()}
            >
              <Image
                src={(fabric.previewImage ?? fabric.image).url}
                alt=""
                width={64}
                height={64}
                className="w-16 h-16 object-cover"
                blurDataURL={(fabric.previewImage ?? fabric.image).placeholderDataUrl}
                placeholder={(fabric.previewImage ?? fabric.image).placeholderDataUrl ? 'blur' : undefined}
              />
              <p>{fabric.name}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};
