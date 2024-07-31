import { bool, envsafe, str, url } from 'envsafe';

export default envsafe({
  NODE_ENV: str({
    devDefault: 'development',
    default: 'production',
    input: process.env.NODE_ENV,
    choices: ['development', 'production'],
  }),
  DIRECTUS_BASE_URL: url({
    devDefault: 'http://localhost:8055/items',
    input: process.env.NEXT_PUBLIC_DIRECTUS_URL,
  }),
  BASE_URL: url({
    devDefault: 'http://localhost:4200',
    input: process.env.NEXT_PUBLIC_BASE_URL,
  }),
  CDN_BASE_URL: url({
    devDefault: 'http://127.0.0.1:9199/v0/b/petit-roudoudou-daae4.appspot.com/o/resized%2F',
    input: process.env.NEXT_PUBLIC_CDN_BASE_URL,
  }),
  POSTHOG_API_KEY: str({
    devDefault: 'none',
    input: process.env.NEXT_PUBLIC_POSTHOG_API_KEY,
  }),
  POSTHOG_HOST: str({
    devDefault: 'none',
    input: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  }),
  POSTHOG_ENABLED: bool({
    devDefault: false,
    input: process.env.NEXT_PUBLIC_POSTHOG_ENABLED,
  }),
  RECAPTCHA_SITE_KEY: str({
    devDefault: '',
    input: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
  }),
  API_BASE_URL: url({
    devDefault: 'http://localhost:3000/trpc',
    input: process.env.NEXT_PUBLIC_API_BASE_URL,
  }),
  COOKIE_DOMAIN: str({ devDefault: 'localhost', input: process.env.NEXT_PUBLIC_COOKIE_DOMAIN }),
});
