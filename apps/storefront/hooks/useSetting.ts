import { SettingKey } from '@prisma/client';
import { trpc } from '../trpc-client';

export default function (key: SettingKey) {
  const trpcUtils = trpc.useUtils();
  const getSettingValueQuery = trpc.settings.getValue.useQuery(key);
  const setSettingValueMutation = trpc.settings.setValue.useMutation({
    onSuccess: () => {
      trpcUtils.settings.getValue.invalidate(key);
    },
  });
  return {
    getSettingValueQuery,
    setSettingValueMutation,
  };
}
