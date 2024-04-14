import { publicProcedure } from '../../trpc';

export default publicProcedure.query(async ({ ctx }) => {
  const fabricGroups = await ctx.orm.fabricGroup.findMany();
  return fabricGroups;
});
