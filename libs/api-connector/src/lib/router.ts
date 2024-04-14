import fabricGroups from './routers/fabric-groups';
import fabricTags from './routers/fabric-tags';
import fabrics from './routers/fabrics';
import { router } from './trpc';

export const trpcRouter = router({
  fabrics,
  fabricGroups,
  fabricTags,
});

export type TRPCRouter = typeof trpcRouter;
