import { ArrowUpTrayIcon, TrashIcon } from '@heroicons/react/24/outline';
import { AppFile, FilesFieldProps, UploadFileFn } from './FilesField';
import React, { PropsWithChildren, useCallback, useRef, useState } from 'react';
import { Popover, PopoverButton, PopoverOverlay, PopoverPanel } from '@headlessui/react';
import clsx from 'clsx';
import { ButtonWithLoading } from '../ButtonWithLoading';

type Props = {
  uploadFile: UploadFileFn;
  onClose: (...files: AppFile[]) => void;
  renderButton: () => React.ReactNode;
  renderFile: FilesFieldProps['renderFile'];
  acceptFileType: string;
  multiple?: boolean;
};

export function UploadPopover({ uploadFile, onClose, renderButton, renderFile, acceptFileType, multiple }: Props) {
  const [nextFiles, setNextFiles] = useState<AppFile[]>([]);
  const progressRef = useRef<HTMLProgressElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const setProgress = useCallback(
    (n: number) => {
      if (progressRef.current) {
        progressRef.current.value = n;
      }
    },
    [progressRef.current]
  );

  const onUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      setError('');
      const files = e.target.files;
      if (!files || files.length < 1) return;
      setLoading(true);
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        await uploadFile(file, (progress) => {
          setProgress((progress + i) / files.length);
        })
          .then((file) => {
            setNextFiles((files) => [...files, file]);
          })
          .catch(() => {
            setError("Une erreur s'est produite lors de l'import d'une ou pluisieurs files");
          });
      }
      setLoading(false);
    },
    [uploadFile]
  );

  const onSubmit = useCallback(() => {
    onClose(...nextFiles);
    setNextFiles([]);
  }, [nextFiles, onClose]);

  return (
    <Popover>
      <PopoverButton as={React.Fragment}>{renderButton()}</PopoverButton>
      <PopoverOverlay className="fixed inset-0 bg-black bg-opacity-25 z-20" />
      <UploadFilesPopoverPanel
        canSubmit={nextFiles.length > 0}
        submitButton={{ label: 'Confirmer', onClick: onSubmit }}
        loading={loading}
      >
        <label htmlFor="upload-file">
          <div className="relative group focus-within:border border-primary-100">
            <div className="w-full aspect-square bg-gray-100 rounded-md"></div>
            <ArrowUpTrayIcon className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            <progress
              ref={progressRef}
              max={1}
              className={clsx(
                !loading && 'hidden',
                'progress-filled:bg-primary-100 opacity-30',
                'absolute top-0 left-0 w-full h-full z-10'
              )}
            ></progress>
            {nextFiles.length > 0 && (
              <>
                <NextFilesPreview files={nextFiles} renderFile={renderFile} />
                <button
                  type="button"
                  className={clsx(
                    'group-hover:pointer-events-auto group-hover:opacity-100',
                    'group-focus-within:pointer-events-auto group-focus-within:opacity-100',
                    'focus:outline-none',
                    'pointer-events-none opacity-0',
                    'absolute top-0 left-0 w-full h-full z-10',
                    'flex items-center justify-center',
                    'bg-[rgba(0,0,0,0.1)]'
                  )}
                  onClick={() => setNextFiles([])}
                >
                  <div className=" bg-white rounded-full p-4 group-focus-within:outline outline-red-500">
                    <TrashIcon className="w-6 h-6 text-red-500 bg-white rounded-full" />
                  </div>
                </button>
              </>
            )}
            <span className="sr-only">Fichier à uploader</span>
            <input
              type="file"
              id="upload-file"
              className="sr-only"
              onChange={onUpload}
              accept={acceptFileType}
              multiple={multiple}
            />
          </div>
          <p className="empty:hidden text-500">{error}</p>
        </label>
      </UploadFilesPopoverPanel>
    </Popover>
  );
}

const UploadFilesPopoverPanel = ({
  children,
  canSubmit,
  submitButton,
  loading,
}: PropsWithChildren<{
  submitButton: {
    label: string;
    onClick: () => void;
  };
  canSubmit: boolean;
  loading: boolean;
}>) => {
  return (
    <PopoverPanel
      modal
      className={clsx(
        'z-20 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
        'bg-white rounded-sm shadow-md',
        'w-full max-w-sm p-4'
      )}
    >
      {({ close }) => (
        <div>
          {children}
          <div className="mt-4">
            <ButtonWithLoading
              loading={loading}
              type="button"
              className={clsx('btn-primary w-full', !canSubmit && 'bg-opacity-50 cursor-not-allowed')}
              onClick={() => {
                if (canSubmit) {
                  submitButton.onClick();
                  close();
                }
              }}
            >
              {submitButton.label}
            </ButtonWithLoading>
          </div>
        </div>
      )}
    </PopoverPanel>
  );
};

const NextFilesPreview = ({ files, renderFile }: { files: AppFile[]; renderFile: FilesFieldProps['renderFile'] }) => {
  return (
    <div
      className={clsx(
        'absolute top-0 left-0 w-full h-full bg-gray-100 overflow-y-scroll',
        files.length > 1 && 'grid grid-cols-3'
      )}
    >
      {files.map((file) => (
        <div key={file.uid}>{renderFile(file, [256, 256])}</div>
      ))}
    </div>
  );
};
