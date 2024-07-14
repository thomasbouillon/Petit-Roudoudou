import { Field } from '@couture-next/ui/form/Field';
import { Controller, useWatch } from 'react-hook-form';
import { ArticleFormType } from '../form';
import clsx from 'clsx';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';

type Props = {
  customizableVariantIndex: number;
};

export default function InheritedCharacteristics({ customizableVariantIndex }: Props) {
  const customizables = useWatch<ArticleFormType, 'customizables'>({
    name: 'customizables',
  });

  return (
    <Field
      label="Options"
      widgetId={`customizableVariants.${customizableVariantIndex}.inherits`}
      helpText="CTRL+click pour sélectionner plusieurs options"
      renderWidget={(className) =>
        customizables.length === 0 ? (
          <small className={clsx(className, 'block h-full')}>Commence par les définir dans l'onglet 'Options'</small>
        ) : (
          <Controller
            name={`customizableVariants.${customizableVariantIndex}.inherits`}
            render={({ field }) => (
              <Listbox
                multiple
                value={field.value ?? []}
                onChange={(v) => {
                  field.onChange(v);
                }}
              >
                {/* <ListboxButton className={clsx('!outline-none', className)}>
                  <span className="flex-grow">Sélectionner les options héritées</span>
                </ListboxButton> */}
                <ListboxOptions anchor={false} as="ul" modal={false} static className={clsx(className, '!static')}>
                  {customizables.map((customizable, i) => (
                    <ListboxOption
                      key={i}
                      as="li"
                      value={customizable.uid}
                      className="line-through data-[selected]:no-underline !outline-none"
                    >
                      {customizable.label}
                    </ListboxOption>
                  ))}
                </ListboxOptions>
              </Listbox>
            )}
          />
        )
      }
    />
  );
}
