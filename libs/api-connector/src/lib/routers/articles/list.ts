import { publicProcedure } from '../../trpc';

export default publicProcedure.query(({ ctx }) => {
  return ctx.orm.article.findMany();
});
