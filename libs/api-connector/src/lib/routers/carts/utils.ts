export function getPublicUrl(path: string, storageBaseUrl: string) {
  path = encodeURIComponent(path);
  if (!storageBaseUrl.endsWith('%2D') && !storageBaseUrl.endsWith('/')) {
    storageBaseUrl += '/';
  }

  if (path.startsWith('carts')) {
    return `${storageBaseUrl}${path}?alt=media`;
  }

  throw new Error('Not implemented yet');
}
