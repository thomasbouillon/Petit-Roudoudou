import { PrismaClient } from '@prisma/client';
import { getStorage } from 'firebase-admin/storage';

type CRMEvent = keyof CRMEventPayload;

type CRMEventPayload = {
  orderPaid: Record<string, never>;
  orderSubmitted: Record<string, never>;
  orderDelivered: { REVIEW_HREF: string };
  orderReviewed: Record<string, never>;
  cartUpdated: Record<string, never>;
};

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
  crm: {
    sendEvent<T extends CRMEvent>(event: T, userEmail: string, data: CRMEventPayload[T]): Promise<void>;
  };
};

type StorageClient = ReturnType<typeof getStorage>;
