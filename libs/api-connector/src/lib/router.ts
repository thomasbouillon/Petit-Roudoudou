import { helloWorldRouter } from './routers/hello-world';
import { router } from './trpc';

export const trpcRouter = router({
  hello: helloWorldRouter,
});

export type TRPCRouter = typeof trpcRouter;
