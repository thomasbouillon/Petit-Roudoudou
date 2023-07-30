import env from '../env';
import { Partners } from '../directus';
import { useQuery } from '@tanstack/react-query';

export default function usePartners() {
  return useQuery({
    queryKey: ['partners'],
    queryFn: () =>
      fetch(env.DIRECTUS_BASE_URL + '/partners?fields=*.*')
        .then((response) => response.json())
        .then((rs) => rs.data as Partners),
  });
}
