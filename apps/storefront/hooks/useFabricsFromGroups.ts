import type { Fabric } from '@couture-next/types';
import { UseQueryResult, useQuery } from '@tanstack/react-query';
import useDatabase from './useDatabase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import converter from '../utils/firebase-add-remove-id-converter';

type Return = UseQueryResult<Record<string, Fabric[]>>;

export default function useFabricsFromGroups(groupIds: string[]): Return {
  const database = useDatabase();

  const getFabricsQuery = useQuery(
    ['fabrics.find.groupIds', ...groupIds],
    async () => {
      const snapshot = await getDocs(
        query(
          collection(database, 'fabrics'),
          where('groupIds', 'array-contains-any', groupIds)
        ).withConverter(converter<Fabric>())
      );

      // Group fabrics by group id
      const result = snapshot.docs.reduce((acc, doc) => {
        const data = doc.data();
        data.groupIds.forEach((groupId) => {
          if (!acc[groupId]) acc[groupId] = [];
          acc[groupId].push(data);
        });
        return acc;
      }, {} as Record<string, Fabric[]>);

      // In case of empty groups
      Object.keys(groupIds).forEach((groupId) => {
        if (!result[groupId]) result[groupId] = [];
      });

      return result;
    }
  );

  return getFabricsQuery;
}
