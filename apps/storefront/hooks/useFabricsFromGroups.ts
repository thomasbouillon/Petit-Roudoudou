import { Fabric } from '@prisma/client';
import { trpc } from '../trpc-client';

export default function useFabricsFromGroups(groupIds: string[]) {
  console.log('groupIds', groupIds);
  const getFabricsQuery = trpc.fabrics.findByGroups.useQuery(groupIds, {
    select: (fabrics) => {
      const grouped = fabrics.reduce((acc, fabric) => {
        fabric.groupIds.forEach((groupId) => {
          if (groupIds.includes(groupId)) {
            if (!(groupId in acc)) {
              acc[groupId] = [];
            }
            acc[groupId].push(fabric);
          }
        });
        return acc;
      }, {} as Record<string, Fabric[]>);
      console.log('grouped', grouped);
      return grouped;
    },
  });
  return getFabricsQuery;
}
