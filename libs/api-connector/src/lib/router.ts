import fabricGroups from './routers/fabric-groups';
import fabricTags from './routers/fabric-tags';
import fabrics from './routers/fabrics';
import { helloWorldRouter } from './routers/hello-world';
import { router } from './trpc';

export const trpcRouter = router({
  hello: helloWorldRouter,
  fabrics,
  fabricGroups,
  fabricTags,
});

export type TRPCRouter = typeof trpcRouter;
