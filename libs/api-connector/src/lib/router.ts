import auth from './routers/auth';
import fabricGroups from './routers/fabric-groups';
import fabricTags from './routers/fabric-tags';
import fabrics from './routers/fabrics';
import settings from './routers/settings';
import { router } from './trpc';

export const trpcRouter = router({
  fabrics,
  fabricGroups,
  fabricTags,
  settings,
  auth,
});

export type TRPCRouter = typeof trpcRouter;
