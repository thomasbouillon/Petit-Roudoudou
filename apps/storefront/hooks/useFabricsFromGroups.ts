import { Fabric } from '@prisma/client';
import { trpc } from '../trpc-client';

export default function useFabricsFromGroups(groupIds: string[]) {
  const getFabricsQuery = trpc.fabrics.findByGroups.useQuery(
    { groupIds, enabled: true },
    {
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

        // Ensure that all groupIds are present in the result
        groupIds.forEach((groupId) => {
          if (!(groupId in grouped)) {
            console.warn(`Group ${groupId} has no linked fabrics`);
            grouped[groupId] = [];
          }
        });

        return grouped;
      },
    }
  );
  return getFabricsQuery;
}
