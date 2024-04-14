import { PrismaClient } from '@prisma/client';
import { getStorage } from 'firebase-admin/storage';

export type Context = {
  orm: PrismaClient;
  environment: {
    CDN_BASE_URL: string;
  };
  storage: StorageClient;
};

type StorageClient = ReturnType<typeof getStorage>;
