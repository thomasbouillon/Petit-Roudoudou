import { getFirestore } from './firebase';
import { Fabric, PrismaClient } from '@prisma/client';

/**
 * Create reviews from csv file and seed them into the database.
 * @param pathToCsv Path to the csv file containing the reviews.
 * @param articleIdMapping First element is the id of the first article in the csv, and so on.
 */
export async function seedFabrics() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not set');
  if (process.env.FIRESTORE_EMULATOR_HOST)
    throw new Error('FIRESTORE_EMULATOR_HOST is set, should be unset for fabrics');

  const firestore = getFirestore({ prod: true });

  const fabrics = await firestore
    .collection('fabrics')
    .get()
    .then(async (snapshot) => {
      return snapshot.docs.map((doc) => doc.data() as Fabric);
    });

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'mongodb://127.0.0.1:27018/roudoudou?directConnection=true',
      },
    },
  });

  const allGroupIds = new Set(fabrics.map((fabric) => fabric.groupIds).flat());

  const groupIdsMapping = {
    GayciXKUkqn8RsK6tBQE: '662264bc6b64e71302d030c3',
    '991SMs9m61gebtDf8LGo': '662264c36b64e71302d030c4',
    qmfrSAjqh0NPhFTf7Tbs: '662264b86b64e71302d030c2',
  };

  // ensure all groupIds are known
  for (const groupId of allGroupIds) {
    if (!groupIdsMapping[groupId]) {
      throw new Error(`Unknown groupId: ${groupId}`);
    }
  }

  // batch by 20
  const batchSize = 20;
  let i = 0;
  while (i < fabrics.length) {
    const batch = fabrics.slice(i, i + batchSize);
    await prisma.fabric.createMany({
      data: batch.map((fabric) => {
        return {
          name: fabric.name,
          image: fabric.image,
          size: fabric.size,
          groupIds: fabric.groupIds.map((groupId) => groupIdsMapping[groupId]),
        };
      }),
    });
    i += batchSize;
  }
}
