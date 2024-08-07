import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { createImageFromStorageUid } from './utils';
import { isAdmin } from '../../middlewares/isAdmin';
import { triggerISR } from '../../isr';

const schema = z
  .object({
    title: z.string().min(3),
    description: z.string().min(3),
    leaderName: z.string().min(1),
    startDate: z.date().min(new Date()),
    endDate: z.date(),
    maxCapacity: z.number().int().min(1),
    image: z.string(),
    price: z.number().min(0),
    location: z.string().min(1),
  })
  .refine((data) => {
    if (new Date(data.startDate) > new Date(data.endDate)) {
      return false;
    }
    return true;
  });

export default publicProcedure
  .use(isAdmin())
  .input(schema)
  .mutation(async ({ ctx, input }) => {
    const image = await createImageFromStorageUid(ctx, input.image);
    // create workshop session
    const workshopSession = await ctx.orm.workshopSession.create({
      data: {
        title: input.title,
        description: input.description,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        maxCapacity: input.maxCapacity,
        remainingCapacity: input.maxCapacity,
        price: input.price,
        image,
        leaderName: input.leaderName,
        location: input.location,
      },
    });

    await triggerISR(ctx, {
      resource: 'workshopSessions',
      event: 'create',
      workshopSession: {
        id: workshopSession.id,
      },
    });

    return workshopSession;
  });
