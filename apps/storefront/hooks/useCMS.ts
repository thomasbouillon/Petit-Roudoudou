import env from '../env';
import { useQuery } from '@tanstack/react-query';

export default function useCMS<TData = unknown>(
  path: string,
  { fields }: { fields?: string } = {}
) {
  const url = new URL(env.DIRECTUS_BASE_URL);
  if (!path.startsWith('/')) path = '/' + path;
  url.pathname += path;
  if (fields) url.searchParams.append('fields', fields);

  return useQuery({
    queryKey: ['cms', path],
    queryFn: () =>
      fetch(url.toString())
        .then((response) => response.json())
        .then((rs) => rs.data as TData),
  });
}
