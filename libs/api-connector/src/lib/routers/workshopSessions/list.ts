import { publicProcedure } from '../../trpc';

export default publicProcedure.query(async ({ ctx }) => {
  return ctx.orm.workshopSession.findMany();
});
