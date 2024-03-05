import { Dialog, Transition } from '@headlessui/react';
import { ArrowUpTrayIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Fragment, useCallback, useState } from 'react';

import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';

import { v4 as uuidv4 } from 'uuid';
import clsx from 'clsx';
import useStorage from '../../../hooks/useStorage';

type PropsBase = {
  isOpen: boolean;
  close: () => void;
  extension?: string;
  title: string;
  buttonLabel: string;
  previousFileUrl?: string;
  multiple?: boolean;
};

type PropsWithMultiple = PropsBase & {
  multiple: true;
  onUploaded: (...files: [{ url: string; uid: string }, ...{ url: string; uid: string }[]]) => void;
  renderPreview: (...urls: [string, ...string[]]) => JSX.Element;
};
type PropsWithoutMultiple = PropsBase & {
  multiple?: false;
  onUploaded: (file: { url: string; uid: string }) => void;
  renderPreview: (url: string) => JSX.Element;
};

type Props = PropsWithMultiple | PropsWithoutMultiple;

export const renderImagesPreview: Props['renderPreview'] = (...urls: [string, ...string[]]) => (
  <div
    className={clsx(
      'absolute top-0 left-0 w-full h-full bg-gray-100 overflow-y-scroll',
      urls.length > 1 && 'grid grid-cols-3'
    )}
  >
    {urls.map((url) => (
      <img className="object-contain object-center w-full h-full" src={url} />
    ))}
  </div>
);

export default function UploadFileModal(props: PropsWithMultiple): JSX.Element;
export default function UploadFileModal(props: PropsWithoutMultiple): JSX.Element;
export default function UploadFileModal({
  isOpen,
  close,
  onUploaded,
  renderPreview,
  extension,
  title,
  buttonLabel,
  previousFileUrl,
  multiple,
}: Props) {
  const [files, setFiles] = useState<{ bytes: File; url: string; uid: string }[]>([]);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState<number[] | null>(null);
  const storage = useStorage();

  const totalProgress =
    progress && progress.length > 0 ? (progress?.reduce((acc, curr) => acc + curr, 0) ?? 0) / progress.length : null;

  const reset = useCallback(() => {
    setError('');
    setFiles([]);
    setProgress(null);
  }, []);

  const extendedClose = useCallback(() => {
    if (files.length === 0) return;
    onUploaded({ url: files[0].url, uid: files[0].uid }, ...files.slice(1).map((f) => ({ url: f.url, uid: f.uid })));
    close();
    reset();
  }, [files, close, onUploaded, reset]);

  const upload = useCallback(
    (event: { target: HTMLInputElement }) => {
      const files = event.target.files;
      if (!files || files.length < 1) return;

      reset();
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExtension = file.name.split('.').pop();
        const fileRef = ref(storage, 'uploaded/' + uuidv4() + '.' + fileExtension);
        const uploadTask = uploadBytesResumable(fileRef, file);
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            setProgress((prev) => {
              prev = prev ?? [];
              prev[i] = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              return prev;
            });
          },
          (error) => {
            setFiles([]);
            setProgress(null);
            setError(error.message);
          },
          () => {
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
              const newFile = { bytes: file, url: downloadURL, uid: fileRef.fullPath };
              setFiles((files) => (multiple ? [...files, newFile] : [newFile]));
            });
          }
        );
      }
    },
    [setFiles, reset, storage]
  );

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-10"
        onClose={() => {
          reset();
          close();
        }}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-6 text-left shadow-xl transition-opacity">
                <Dialog.Title as="h2" className="text-3xl mb-4 text-center">
                  {title}
                </Dialog.Title>

                <label className="cursor-pointer">
                  <div className="relative group focus-within:border border-primary-100">
                    <div className="w-full aspect-square bg-gray-100 rounded-md"></div>
                    <ArrowUpTrayIcon className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    {totalProgress !== null && totalProgress < 100 && (
                      <progress
                        value={totalProgress}
                        max={100}
                        className="text-primary-100 w-full rounded-full mt-2"
                      ></progress>
                    )}
                    {/* Preview */}
                    {files.length > 0 && (
                      <>
                        {renderPreview && renderPreview(files[0].url, ...files.slice(1).map((f) => f.url))}
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
                          onClick={reset}
                        >
                          <div className=" bg-white rounded-full p-4 group-focus-within:outline outline-red-500">
                            <TrashIcon className="w-6 h-6 text-red-500 bg-white rounded-full" />
                          </div>
                        </button>
                      </>
                    )}
                    {/* Fallback to previous value for preview */}
                    {files.length === 0 && !!previousFileUrl && !!renderPreview && renderPreview(previousFileUrl)}
                    <span className="sr-only">Fichier à uploader</span>
                    <input type="file" className="sr-only" onChange={upload} accept={extension} multiple={multiple} />
                  </div>
                </label>

                {!!error && <p className="text-red-500">{error}</p>}

                <div className="mt-4">
                  <button
                    type="button"
                    className={clsx('btn-primary w-full', files.length === 0 && 'opacity-50 cursor-not-allowed')}
                    disabled={files.length === 0}
                    onClick={extendedClose}
                  >
                    {buttonLabel}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
