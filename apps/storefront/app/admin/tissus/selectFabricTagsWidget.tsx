import { useCallback, useMemo, useRef, useState } from 'react';
import { Combobox } from '@headlessui/react';
import { Spinner } from '@couture-next/ui';
import { CheckIcon } from '@heroicons/react/24/solid';
import { UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { FabricFormType } from './form';
import { useDebounce } from '../../../hooks/useDebounce';
import clsx from 'clsx';
import useFabricTags from 'apps/storefront/hooks/useFabricTags';

type Props = {
  className?: string;
  setValue: UseFormSetValue<FabricFormType>;
  watch: UseFormWatch<FabricFormType>;
};

export default function SelectFabricTagsWidget({ className, setValue, watch }: Props) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 500);
  const labelsMemory = useRef({} as Record<string, string>);

  const { query: getFabricTagsQuery, addTagMutation } = useFabricTags({
    search: debouncedQuery,
  });
  if (getFabricTagsQuery.isError) throw getFabricTagsQuery.error;

  const handleAddTag = useCallback(
    async (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (
        !e.currentTarget.value ||
        addTagMutation.isPending ||
        getFabricTagsQuery.data?.find((tag) => tag.name === e.currentTarget.value)
      )
        return;
      if (e.key === 'Enter') {
        e.preventDefault();
        await addTagMutation.mutateAsync({
          name: e.currentTarget.value,
        });
      }
    },
    [addTagMutation]
  );

  const selected = useMemo(() => {
    if (!watch('tagIds')) return [];
    return watch('tagIds').map((id) => {
      if (!labelsMemory.current[id]) {
        const tag = getFabricTagsQuery.data?.find((g) => g.id === id);
        if (tag) labelsMemory.current[id] = tag.name;
      }
      return labelsMemory.current[id];
    });
  }, [getFabricTagsQuery.data, watch('tagIds')]);

  return (
    <div className="relative">
      {addTagMutation.isPending && (
        <div className="absolute top-1/2 -translate-y-1/2 right-2">
          <Spinner className="w-6 h-6" />
        </div>
      )}
      <Combobox
        multiple
        onChange={(values) => {
          setValue('tagIds', values, { shouldDirty: true });
        }}
        value={watch('tagIds')}
        as={'div'}
      >
        <div className="relative">
          <Combobox.Input
            className={clsx(className, 'peer')}
            onKeyDown={handleAddTag}
            placeholder="Ajouter un tag"
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            autoComplete="off"
          />
          <div
            className={clsx(
              className,
              'absolute inset-0 bg-white flex items-center px-2 pointer-events-none peer-focus:hidden ui-open:hidden'
            )}
          >
            {selected.join(', ')}
          </div>
          <small className="absolute bottom-full left-0 hidden ui-open:block peer-focus:block pl-4 mt-1">
            Selection: {selected.join(', ') || '-'}
          </small>
        </div>

        <div className="relative">
          <Combobox.Options className="absolute top-full left-0 w-full z-10 bg-white rounded-md mt-2 border overflow-hidden shadow-md">
            {getFabricTagsQuery.data?.map((fabricTag) => (
              <Combobox.Option
                key={fabricTag.id}
                value={fabricTag.id}
                className="p-2 first:border-none border-t flex items-center justify-between ui-selected:text-primary-100"
              >
                {fabricTag.name}
                <CheckIcon className="ui-selected:visible invisible w-4 h-4" />
              </Combobox.Option>
            ))}
            {getFabricTagsQuery.isPending && (
              <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2">
                <Spinner className="w-6 h-6" />
              </div>
            )}
            {getFabricTagsQuery.data?.length === 0 && (
              <Combobox.Option value="" disabled className="p-2">
                Aucun tag trouvé, choisi un nom et utilise la touche &quot;Entrée&quot; pour créer un nouveau tag.
              </Combobox.Option>
            )}
          </Combobox.Options>
        </div>
      </Combobox>
    </div>
  );
}
