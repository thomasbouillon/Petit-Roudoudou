import { BoxtalClient } from '@couture-next/shipping';
import { BillingClient, MailerClient } from '@couture-next/types';
import { PrismaClient } from '@prisma/client';
import type { Storage } from 'firebase-admin/storage';
import { CmsClient } from '@couture-next/cms';
import type { Stripe } from 'stripe';

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
    STORAGE_BASE_URL: string;
    FRONTEND_BASE_URL: string;
    ISR_SECRET: string;
    ISR_URL: string;
    ADMIN_EMAIL: string;
  };
  shipping: BoxtalClient;
  storage: Storage;
  stripe: {
    signature: string | undefined;
    extractEventFromRawBody: (body: string, signature: string) => Promise<Stripe.Event>;
  };
  cookies: {
    getAuthCookie(): string | null;
    setAuthCookie(token: string): void;
    clearAuthCookie(): void;
  };
  validateRecaptcha(token: string): Promise<boolean>;
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
  billing: BillingClient;
  cms: CmsClient;
  mailer: MailerClient;
};
