'use client';

import { Spinner } from '@couture-next/ui';
import { Dialog, DialogPanel, Transition } from '@headlessui/react';
import { ChatBubbleOvalLeftIcon } from '@heroicons/react/24/solid';
import clsx from 'clsx';
import Script from 'next/script';
import { useEffect, useState } from 'react';

export default function LiveChat() {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [shouldOpenOnLoad, setShouldOpenOnLoad] = useState(false);

  useEffect(() => {
    const w = window as any;
    if (
      typeof window === 'undefined' ||
      typeof w.BrevoConversations !== 'undefined' ||
      process.env.NODE_ENV === 'development'
    )
      return;

    w.BrevoConversationsID = '65832f53e8165b04ab20878c';
    w.BrevoConversationsSetup = {
      zIndex: 19,
    };
    w.BrevoConversations =
      w.BrevoConversations ||
      function () {
        (w.BrevoConversations.q = w.BrevoConversations.q || []).push(arguments);
      };
  }, []);

  useEffect(() => {
    // Auto Load after 20 seconds (better for web vitals)
    setTimeout(() => {
      setShouldLoad(true);
      setShouldOpenOnLoad(false);
    }, 20000);
  }, []);

  useEffect(() => {
    if (shouldOpenOnLoad && scriptLoaded) {
      (window as any).BrevoConversations('openChat', true);
    }
  }, [shouldOpenOnLoad, scriptLoaded]);

  return (
    <>
      {!scriptLoaded && (
        <>
          <div
            className={clsx('fixed bottom-4 right-4 flex flex-col-reverse gap-2 z-[19]', shouldOpenOnLoad && 'sr-only')}
          >
            <button
              type="button"
              className={'bg-primary-100 px-4 py-2 rounded-xl ml-auto shadow-[0_0_10px_5px_rgba(0,0,0,0.15)]'}
              onClick={() => {
                setShouldLoad(true);
                setShouldOpenOnLoad(true);
              }}
            >
              <ChatBubbleOvalLeftIcon className="h-6 w-6 text-white -scale-x-100" />
              <span className="sr-only">Ouvrir le chat pour echanger des messages en direct.</span>
            </button>
          </div>
          <Transition
            show={shouldOpenOnLoad}
            as="div"
            enter="transition-opacity duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog
              className="fixed top-0 left-0 right-0 bottom-0 sm:top-auto sm:left-auto sm:right-4 sm:bottom-4 bg-white sm:bg-primary-100 shadow-md p-2 rounded border"
              onClose={() => {
                setShouldOpenOnLoad(false);
              }}
            >
              <DialogPanel className="flex flex-col gap-4 items-center justify-center h-full">
                <p className="sm:sr-only">Chargement du chat en cours...</p>
                <Spinner />
              </DialogPanel>
            </Dialog>
          </Transition>
        </>
      )}
      {shouldLoad && (
        <Script
          src="https://conversations-widget.brevo.com/brevo-conversations.js"
          strategy="lazyOnload"
          onReady={() => setScriptLoaded(true)}
        />
      )}
    </>
  );
}
