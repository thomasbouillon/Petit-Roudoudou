import env from '../env';
import { Event } from '../directus';
import { useQuery } from '@tanstack/react-query';

export default function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: () =>
      fetch(env.DIRECTUS_BASE_URL + '/events')
        .then((response) => response.json())
        .then((rs) => rs.data as Event[]),
  });
}
