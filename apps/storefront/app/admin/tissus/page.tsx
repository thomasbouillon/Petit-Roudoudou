'use client';

import { useQuery } from '@tanstack/react-query';
import useDatabase from '../../../hooks/useDatabase';
import { collection, getDocs } from 'firebase/firestore';
import { Fabric } from '@couture-next/types';
import Link from 'next/link';

export default function Page() {
  const database = useDatabase();

  const { data: fabrics, error } = useQuery(['fabrics'], () =>
    getDocs(collection(database, 'fabrics')).then((snapshot) =>
      snapshot.docs.map(
        (doc) =>
          ({
            ...doc.data(),
            _id: doc.id,
          } as Fabric)
      )
    )
  );
  if (error) throw error;
  if (fabrics === undefined) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-3xl font-serif text-center mb-8">Tissus</h1>
      <ul className="border rounded-md shadow-md mx-auto max-w-md w-full">
        {fabrics.map((fabric) => (
          <li key={fabric._id} className="border-b py-4">
            <Link
              className="px-8 block"
              href={`/admin/tissus/${fabric._id}/modifier`}
            >
              {fabric.name}
            </Link>
          </li>
        ))}
        <li>
          <Link
            href="/admin/tissus/nouveau"
            className="btn-light text-center w-full"
          >
            Ajouter
          </Link>
        </li>
      </ul>
    </div>
  );
}
