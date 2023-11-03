'use client';

import { useQuery } from '@tanstack/react-query';
import useDatabase from '../../hooks/useDatabase';
import { collection, getDocs } from 'firebase/firestore';
import { firestoreConverterAddRemoveId } from '@couture-next/utils';
import { Fabric, FabricGroup } from '@couture-next/types';
import Image from 'next/image';
import { loader } from '../../utils/next-image-firebase-storage-loader';

export default function Page() {
  const database = useDatabase();
  const fabricsQuery = useQuery(['fabrics.all'], () => {
    return getDocs(
      collection(database, 'fabrics').withConverter(
        firestoreConverterAddRemoveId<Fabric>()
      )
    ).then((snapshot) => snapshot.docs.map((doc) => doc.data()));
  });

  const groupsQuery = useQuery(['fabricGroups.all'], () => {
    return getDocs(
      collection(database, 'fabricGroups').withConverter(
        firestoreConverterAddRemoveId<FabricGroup>()
      )
    ).then((snapshot) =>
      snapshot.docs.reduce((acc, doc) => {
        acc[doc.id] = doc.data();
        return acc;
      }, {} as Record<string, FabricGroup>)
    );
  });

  return (
    <div className="mx-auto max-w-6xl px-4 mt-8 my-8">
      <h1 className="text-4xl text-center font-serif mb-6">Tous les tissus</h1>
      <div className="grid grid-cols-[repeat(auto-fill,min(100%,18rem)) gap-4]">
        {fabricsQuery.data?.map((fabric) => (
          <div key={fabric._id}>
            <div className="relative">
              <Image
                loader={loader}
                src={fabric.image.url}
                width={288}
                height={288}
                alt=""
                className="border rounded-sm aspect-square object-cover object-center"
              />
              <div className="absolute bottom-2 right-2 flex items-center justify-end flex-wrap-reverse max-w-full">
                {fabric.groupIds.map(
                  (groupId) =>
                    groupsQuery.data?.[groupId] && (
                      <span
                        key={groupId}
                        className="bg-white block border rounded-full py-1 px-2 shadow-sm"
                      >
                        {groupsQuery.data?.[groupId].name}
                      </span>
                    )
                )}
              </div>
            </div>
            <p className="text-center px-4 mt-2">{fabric.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
