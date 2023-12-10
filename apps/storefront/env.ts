import { envsafe, str, url } from 'envsafe';

export default envsafe({
  DIRECTUS_BASE_URL: url({
    devDefault: 'http://localhost:8055/items',
    input: process.env.NEXT_PUBLIC_DIRECTUS_URL,
  }),
  DIRECTUS_ASSETS_URL: url({
    devDefault: 'http://localhost:8055/assets',
    input: process.env.NEXT_PUBLIC_DIRECTUS_ASSETS_URL,
  }),
  BASE_URL: url({
    devDefault: 'http://localhost:4200',
    input: process.env.NEXT_PUBLIC_BASE_URL,
  }),
  POSTHOG_API_KEY: str({
    input: process.env.NEXT_PUBLIC_POSTHOG_API_KEY,
  }),
  POSTHOG_HOST: str({
    input: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  }),
});
