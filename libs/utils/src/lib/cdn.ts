export function shouldBeInCdn(path: string) {
  return path.startsWith('articles') || path.startsWith('fabrics') || path.startsWith('cms');
}
