'use client';

import { Fragment, useEffect, useState } from 'react';
import { Spinner } from '@couture-next/ui';
import { useRouter, useSearchParams } from 'next/navigation';
import { Dialog, Transition } from '@headlessui/react';
import { routes } from '@couture-next/routing';
import WebsiteSurvey from './survey';
import { trpc } from 'apps/storefront/trpc-client';

export default function Page() {
  const queryParams = useSearchParams();

  const [timeoutEnded, setTimeoutEnded] = useState(false);
  const [warningDismissed, setWarningDismissed] = useState(false);

  // TODO WEBSOCKET
  const currentOrderQuery = trpc.orders.findById.useQuery(queryParams.get('orderId') as string);

  if (currentOrderQuery.isError) throw currentOrderQuery.error;
  if (!currentOrderQuery.isPending && !currentOrderQuery.data) throw 'Order not found';

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setTimeoutEnded(true);
    }, 15000);

    return () => clearTimeout(timeoutId);
  }, []);

  const router = useRouter();
  const goBackToHome = () => {
    router.push(routes().index());
  };

  return (
    <div className="pt-[20vh]">
      <div className="max-w-3xl mx-auto shadow-sm border rounded-sm mt-8 px-4 py-8 text-center">
        <h1 className="font-serif text-3xl mb-4">
          {(currentOrderQuery.data?.status === 'WAITING_BANK_TRANSFER' && 'Commande en attente de paiement') ||
            'Confirmation de paiement'}
        </h1>
        {currentOrderQuery.data?.status === 'PAID' && (
          <>
            <p>J'ai déjà hâte que tu la recoives !</p>
            <p className="mt-2">
              Elle porte le numéro {currentOrderQuery.data.reference} et tu peux consulter son avancement sur ton
              compte.
            </p>
            <WebsiteSurvey onSubmited={goBackToHome} />
          </>
        )}
        {currentOrderQuery.data?.status === 'WAITING_BANK_TRANSFER' && (
          <>
            <p>Les instructions pour effectuer votre virement vous ont été envoyées par email.</p>
            <p className="mt-2">
              <span className="font-bold">Merci</span> pour votre commande !
            </p>
            <WebsiteSurvey onSubmited={goBackToHome} />
          </>
        )}
        {currentOrderQuery.data?.status === 'DRAFT' && (
          <>
            <p>Votre paiement a bien été pris en compte.</p>
            <div className="flex items-center justify-center my-8">
              <Spinner className="w-6 h-6" />
            </div>
            <p>Enregistrement de votre commande...</p>
          </>
        )}
        {currentOrderQuery.isPending && (
          <>
            <div className="flex items-center justify-center my-8">
              <Spinner className="w-6 h-6" />
            </div>
            <p>Chargement de votre commande...</p>
          </>
        )}
        <Transition
          appear
          show={
            !warningDismissed &&
            timeoutEnded &&
            (currentOrderQuery.isPending || currentOrderQuery.data?.status === 'DRAFT')
          }
          as={Fragment}
        >
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
                  <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-6 text-left shadow-xl transition-opacity space-y-2">
                    <Dialog.Title className="font-serif text-2xl" as="h2">
                      Oups...
                    </Dialog.Title>
                    <p>
                      Il semblerai que le traitement prenne plus de temps que prévu. Nous avons reçu une alerte et nous
                      allons vérifier votre commande manuellement.
                    </p>
                    <p>Vous recevrez un email dès que la commande sera validée.</p>
                    <p>
                      Si vous avez la moindre question, n'hésitez pas à nous contacter directement par instagram ou
                      email.
                    </p>
                    <button
                      type="button"
                      className="btn-primary mx-auto mt-4"
                      onClick={() => setWarningDismissed(true)}
                    >
                      Fermer
                    </button>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      </div>
      {currentOrderQuery.data?.status === 'PAID' || currentOrderQuery.data?.status === 'WAITING_BANK_TRANSFER' ? (
        <ThanksAnimation />
      ) : (
        <ThanksAnimationPlaceholder />
      )}
    </div>
  );
}

const ThanksAnimation = () => {
  return (
    <div className="grid grid-cols-2 gap-[50vw]">
      <video src="/videos/thanks.mp4" autoPlay playsInline loop className="aspect-square" />
      <video src="/videos/thanks.mp4" autoPlay playsInline loop className="aspect-square scale-x-[-1]" />
    </div>
  );
};

const ThanksAnimationPlaceholder = () => {
  return (
    <div className="grid grid-cols-2 gap-[50vw]">
      <div className="aspect-square"></div>
    </div>
  );
};
