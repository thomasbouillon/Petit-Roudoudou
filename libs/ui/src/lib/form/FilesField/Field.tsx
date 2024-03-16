'use client';

import { useFieldArray, useFormContext } from 'react-hook-form';
import React, { useCallback } from 'react';
import { UploadPopover } from './UploadPopover';
import { Draggable } from '../Draggable';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

export type UploadFileFn = (file: File, onProgressCallback?: (n: number) => void) => Promise<AppFile>;

export type AppFile = {
  url: string;
  uid: string;
};

export type FilesFieldProps = {
  acceptFileType?: string;
  multiple?: boolean;

  formControlKey: string;

  uploadFile: UploadFileFn;

  renderFile: (file: AppFile, size: [number, number]) => React.ReactNode;

  ui?: {
    addFileButtonClassName?: string;
    addFileButtonLabel?: string;
    fileSize?: {
      width: number;
      height: number;
    };
  };
};

export function Field(props: FilesFieldProps) {
  return props.multiple ? <MultipleFilesField {...props} /> : <SingleFileField {...props} />;
}

function MultipleFilesField({ formControlKey, uploadFile, ui, acceptFileType, multiple, renderFile }: FilesFieldProps) {
  const form = useFormContext<Record<string, AppFile[]>>();
  const {
    fields: files,
    append,
    update,
    remove,
    move,
  } = useFieldArray({
    control: form.control,
    name: formControlKey,
  });

  const addFiles = useCallback(
    (...newFiles: AppFile[]) => {
      append(newFiles);
    },
    [append]
  );

  return (
    <fieldset>
      <div className="flex flex-wrap">
        <Draggable
          items={files}
          handleMove={move}
          renderItem={(file, i) => (
            <div key={file.uid}>
              {renderFile(file, [ui?.fileSize?.width ?? 256, ui?.fileSize?.height ?? 256])}
              <TrashIcon
                className="bg-white rounded-full border absolute top-0 right-0 p-2 w-10 h-10"
                onClick={() => remove(i)}
              />
              <UploadPopover
                uploadFile={uploadFile}
                onClose={(newFile) => update(i, newFile)}
                acceptFileType={acceptFileType ?? '*/*'}
                renderButton={() => (
                  <PencilSquareIcon className="bg-white rounded-full border absolute top-12 right-0 p-2 w-10 h-10" />
                )}
                renderFile={renderFile}
              />
            </div>
          )}
        />
      </div>
      <UploadPopover
        uploadFile={uploadFile}
        onClose={addFiles}
        renderButton={() => (
          <button type="button" className={clsx(ui?.addFileButtonClassName ?? 'btn-primary mx-auto', 'mt-2')}>
            {ui?.addFileButtonLabel ?? 'Ajouter un fichier'}
          </button>
        )}
        multiple={multiple}
        renderFile={renderFile}
        acceptFileType={acceptFileType ?? '*/*'}
      />
    </fieldset>
  );
}

function SingleFileField({
  formControlKey,
  uploadFile,
  ui,
  acceptFileType,
  renderFile,
}: Omit<FilesFieldProps, 'multiple'>) {
  const form = useFormContext<Record<string, AppFile | null>>();
  const file = form.watch(formControlKey);

  return (
    <fieldset>
      <div className="flex flex-wrap">
        {!!file && (
          <div key={file.uid}>
            {renderFile(file, [ui?.fileSize?.width ?? 256, ui?.fileSize?.height ?? 256])}
            <UploadPopover
              uploadFile={uploadFile}
              onClose={(newFile) => form.setValue(formControlKey, newFile, { shouldDirty: true })}
              acceptFileType={acceptFileType ?? '*/*'}
              renderButton={() => (
                <PencilSquareIcon className="bg-white rounded-full border absolute top-0 right-0 p-2 w-10 h-10" />
              )}
              renderFile={renderFile}
            />
          </div>
        )}
      </div>
      <UploadPopover
        uploadFile={uploadFile}
        onClose={(newFile) => form.setValue(formControlKey, newFile, { shouldDirty: true })}
        renderButton={() => (
          <button type="button" className={ui?.addFileButtonClassName ?? 'btn-primary mx-auto'}>
            {ui?.addFileButtonLabel ?? 'Ajouter un fichier'}
          </button>
        )}
        renderFile={renderFile}
        acceptFileType={acceptFileType ?? '*/*'}
      />
    </fieldset>
  );
}
