import { Dialog, Transition } from '@headlessui/react';
import { ArrowUpTrayIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Fragment, useCallback, useState } from 'react';

import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';

import { v4 as uuidv4 } from 'uuid';
import clsx from 'clsx';
import useStorage from '../../../hooks/useStorage';

export default function UploadImageModal({
  isOpen,
  close,
  onUploaded,
}: {
  isOpen: boolean;
  close: () => void;
  onUploaded: (url: string) => void;
}) {
  const [file, setFile] = useState<{ bytes: File; url: string }>();
  const [error, setError] = useState('');
  const [progress, setProgress] = useState<number | null>(null);
  const storage = useStorage();

  const reset = useCallback(() => {
    setError('');
    setFile(undefined);
    setProgress(null);
  }, []);

  const extendedClose = useCallback(() => {
    if (!file) return;
    onUploaded(file.url);
    close();
    reset();
  }, [file, close, onUploaded, reset]);

  const upload = useCallback(
    (event: { target: HTMLInputElement }) => {
      const files = event.target.files;
      if (!files || files.length < 1) return;
      const file = files[0];
      reset();

      const fileRef = ref(storage, 'uploaded/' + uuidv4());

      const uploadTask = uploadBytesResumable(fileRef, file);
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          setProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        },
        (error) => {
          setError(error.message);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            setFile({ bytes: file, url: downloadURL });
          });
        }
      );
    },
    [setFile, reset, storage]
  );

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={close}>
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
                  Nouvelle image
                </Dialog.Title>

                <label className="cursor-pointer">
                  <div className="relative group">
                    <div className="w-full aspect-square bg-gray-100 rounded-md"></div>
                    <ArrowUpTrayIcon className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    {progress !== null && (
                      <progress
                        value={progress}
                        max={100}
                        className="text-primary-100"
                      ></progress>
                    )}
                    {!!file && (
                      <>
                        <img
                          src={file.url}
                          className="absolute top-0 left-0 w-full h-full object-contain bg-gray-100 object-center"
                        />
                        <button
                          type="button"
                          className={clsx(
                            'group-hover:pointer-events-auto group-hover:opacity-100',
                            'pointer-events-none opacity-0',
                            'absolute top-0 left-0 w-full h-full',
                            'flex items-center justify-center',
                            'bg-[rgba(0,0,0,0.1)]'
                          )}
                          onClick={reset}
                        >
                          <div className=" bg-white rounded-full p-4">
                            <TrashIcon className="w-6 h-6 text-red-500 bg-white rounded-full" />
                          </div>
                        </button>
                      </>
                    )}
                  </div>
                  <span className="sr-only">Image à uploader</span>
                  <input type="file" className="sr-only" onChange={upload} />
                </label>

                {!!error && <p className="text-red-500">{error}</p>}

                <div className="mt-4">
                  <button
                    type="button"
                    className={clsx(
                      'btn-primary w-full',
                      !file && 'opacity-50 cursor-not-allowed'
                    )}
                    disabled={!file}
                    onClick={extendedClose}
                  >
                    Ajouter une image
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
