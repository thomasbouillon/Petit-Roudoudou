import { shouldBeInCdn } from './cdn';

export function getPublicUrl(
  path: string,
  env: {
    STORAGE_BASE_URL: string;
    CDN_BASE_URL: string;
  }
) {
  console.log(env, path);

  if (path.startsWith('/')) {
    path = path.slice(1);
  } else if (path.startsWith('%2F')) {
    path = path.slice(3);
  }

  let baseUrl = shouldBeInCdn(path) ? env.CDN_BASE_URL : env.STORAGE_BASE_URL;
  if (!baseUrl.endsWith('%2F') && !baseUrl.endsWith('/')) {
    baseUrl += '/';
  }

  const url = new URL(baseUrl + encodeURIComponent(path));
  url.searchParams.append('alt', 'media');
  return url.toString();
}
