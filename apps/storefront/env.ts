import { bool, envsafe, str, url } from 'envsafe';

export default envsafe({
  DIRECTUS_BASE_URL: url({
    devDefault: 'http://localhost:8055/items',
    input: process.env.NEXT_PUBLIC_DIRECTUS_URL,
  }),
  BASE_URL: url({
    devDefault: 'http://localhost:4200',
    input: process.env.NEXT_PUBLIC_BASE_URL,
  }),
  STORAGE_BASE_URL: url({
    devDefault: 'http://127.0.0.1:9199/v0/b/petit-roudoudou-daae4.appspot.com/o',
    input: process.env.NEXT_PUBLIC_STORAGE_BASE_URL,
  }),
  POSTHOG_API_KEY: str({
    devDefault: '',
    input: process.env.NEXT_PUBLIC_POSTHOG_API_KEY,
  }),
  POSTHOG_HOST: str({
    devDefault: '',
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
});
