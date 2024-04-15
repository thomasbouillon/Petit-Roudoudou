import { PrismaClient } from '@prisma/client';
import { getStorage } from 'firebase-admin/storage';

export type Context = {
  orm: PrismaClient;
  environment: {
    CDN_BASE_URL: string;
  };
  storage: StorageClient;
  cookies: {
    getAuthCookie(): string | null;
    setAuthCookie(token: string): void;
    clearAuthCookie(): void;
  };
  auth: {
    jwt: {
      decode(token: string): { id: string; expiresAt?: number };
      sign(userId: string): string;
    };
    googleOAuth: {
      getAuthorizationUrl(): string;
      tradeAuthorizationCode(authorizationCode: string): Promise<{
        user: {
          email: string;
          given_name: string;
          family_name: string;
        };
      }>;
    };
    verifyPassword(password: string, hash: string): Promise<boolean>;
    hashPassword(password: string): Promise<string>;
  };
};

type StorageClient = ReturnType<typeof getStorage>;
