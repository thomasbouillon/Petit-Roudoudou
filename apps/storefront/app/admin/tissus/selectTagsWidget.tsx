import { useCallback, useState } from 'react';
import useFabricTags from '../../../hooks/useFabricTags';
import { Combobox } from '@headlessui/react';
import { Spinner } from '@couture-next/ui';
import { CheckIcon } from '@heroicons/react/24/solid';
import { UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { FabricFormType } from './form';
import { useDebounce } from '../../../hooks/useDebounce';

type Props = {
  className?: string;
  setValue: UseFormSetValue<FabricFormType>;
  watch: UseFormWatch<FabricFormType>;
};

export default function SelectTags({ className, setValue, watch }: Props) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 500);

  const { query: getFabricTagsQuery, addTagMutation } = useFabricTags({
    search: debouncedQuery,
  });
  if (getFabricTagsQuery.isError) throw getFabricTagsQuery.error;

  const handleAddTag = useCallback(
    async (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (
        !e.currentTarget.value ||
        addTagMutation.isLoading ||
        getFabricTagsQuery.data?.find(
          (tag) => tag.name === e.currentTarget.value
        )
      )
        return;
      if (e.key === 'Enter') {
        e.preventDefault();
        const name = e.currentTarget.value;
        await addTagMutation.mutateAsync({
          name: e.currentTarget.value,
        });
        setValue('tags', [...watch('tags'), name], {
          shouldDirty: true,
        });
      }
    },
    [addTagMutation, setValue, watch]
  );

  return (
    <div className="relative">
      {addTagMutation.isLoading && (
        <div className="absolute top-1/2 -translate-y-1/2 right-2">
          <Spinner className="w-6 h-6" />
        </div>
      )}
      <Combobox
        multiple
        onChange={(values) => {
          setValue('tags', values, { shouldDirty: true });
        }}
        value={watch('tags')}
      >
        <Combobox.Input
          className={className}
          onKeyDown={handleAddTag}
          placeholder="Ajouter un tag"
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          autoComplete="off"
        />
        <div className="relative">
          <Combobox.Options className="absolute top-full z-10 left-0 w-full bg-white rounded-md mt-2 border overflow-hidden shadow-md">
            {getFabricTagsQuery.data?.map((fabricTag) => (
              <Combobox.Option
                key={fabricTag._id}
                value={fabricTag.name}
                className="p-2 first:border-none border-t flex items-center justify-between"
              >
                {fabricTag.name}
                <CheckIcon className="ui-selected:visible invisible w-4 h-4 text-primary-100" />
              </Combobox.Option>
            ))}
            {getFabricTagsQuery.isLoading && (
              <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2">
                <Spinner className="w-6 h-6" />
              </div>
            )}
            {getFabricTagsQuery.data?.length === 0 && (
              <Combobox.Option value="" disabled className="p-2">
                Aucun tag trouvé, choisi un nom et utilise la touche
                &quot;Entrée&quot; pour créer un nouveau tag.
              </Combobox.Option>
            )}
          </Combobox.Options>
        </div>
      </Combobox>
      <small className="min-h-[1.5rem] pl-4 mt-1">
        Selection: {watch('tags').join(', ') || '-'}
      </small>
    </div>
  );
}
