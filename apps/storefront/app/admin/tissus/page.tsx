'use client';

import { useQuery } from '@tanstack/react-query';
import useDatabase from '../../../hooks/useDatabase';
import { collection, getDocs } from 'firebase/firestore';
import { Fabric } from '@couture-next/types';
import Link from 'next/link';
import { firestoreConverterAddRemoveId } from '@couture-next/utils';
import { routes } from '@couture-next/routing';
import Image from 'next/image';

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
  if (fabrics === undefined) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-3xl font-serif text-center mb-8">Tissus</h1>
      <ul className="border rounded-md shadow-md mx-auto max-w-md w-full">
        {fabrics.map((fabric) => (
          <li key={fabric._id} className="border-b">
            <Link
              className="px-8 flex items-center gap-8 py-2"
              href={routes().admin().fabrics().fabric(fabric._id).edit()}
            >
              <Image
                src={fabric.image.url}
                alt=""
                width={64}
                height={64}
                className="w-16 h-16"
                blurDataURL={fabric.image.placeholderDataUrl}
                placeholder={fabric.image.placeholderDataUrl ? 'blur' : undefined}
              />
              <p>{fabric.name}</p>
            </Link>
          </li>
        ))}
        <li>
          <Link href={routes().admin().fabrics().new()} className="btn-light text-center w-full">
            Ajouter
          </Link>
        </li>
      </ul>
    </div>
  );
}
