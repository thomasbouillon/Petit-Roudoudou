import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { SettingKey } from '@prisma/client';

export default publicProcedure
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
