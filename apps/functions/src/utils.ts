import env from './env';

const baseUrl = env.STORAGE_BASE_URL;

export function getPublicUrl(path: string) {
  path = encodeURIComponent(path);
  return `${baseUrl}/${path}?alt=media`;
}
