import { publicProcedure, router } from '../trpc';
import { z } from 'zod';

const helloSchema = z.object({
  name: z.string().min(1),
});

export const helloWorldRouter = router({
  sayHello: publicProcedure.input(helloSchema).query(async ({ input }) => {
    return `Hello, ${input.name}!`;
  }),
});
