import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { SettingKey } from '@prisma/client';
import { isAdmin } from '../../middlewares/isAdmin';

export default publicProcedure
  .use(isAdmin())
  .input(
    z.object({
      key: z.nativeEnum(SettingKey),
      value: z.boolean(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    const res = await ctx.orm.setting.updateMany({
      where: {
        key: input.key,
      },
      data: {
        data: input.value,
      },
    });
    if (res.count === 0) {
      await ctx.orm.setting.create({
        data: {
          key: input.key,
          data: input.value,
        },
      });
    }
    return;
  });
