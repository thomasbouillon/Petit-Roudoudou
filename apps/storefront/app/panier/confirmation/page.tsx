'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import useDatabase from '../../../../storefront/hooks/useDatabase';
import { useFirestoreDocumentQuery } from '../../../../storefront/hooks/useFirestoreDocumentQuery';
import { collection, doc } from 'firebase/firestore';
import { Spinner } from '@couture-next/ui';
import { useRouter, useSearchParams } from 'next/navigation';
import { firestoreOrderConverter } from '@couture-next/utils';
import { useAuth } from '../../../contexts/AuthContext';
import { Dialog, Transition } from '@headlessui/react';
import Link from 'next/link';
import { routes } from '@couture-next/routing';
import WebsiteSurvey from './survey';

export default function Page() {
  const { userQuery } = useAuth();
  const queryParams = useSearchParams();
  const database = useDatabase();
  const docRef = useMemo(
    () =>
      doc(
        collection(database, 'orders').withConverter(firestoreOrderConverter),
        (queryParams.get('orderId') as string) ?? 'will-not-be-used'
      ),
    [database, queryParams]
  );

  const [timeoutEnded, setTimeoutEnded] = useState(false);
  const [warningDismissed, setWarningDismissed] = useState(false);

  const currentOrderQuery = useFirestoreDocumentQuery(docRef, {
    enabled: !!queryParams.get('orderId') && !userQuery.isPlaceholderData,
  });

  console.log(currentOrderQuery.status);

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
    <div className="max-w-3xl mx-auto shadow-sm border rounded-sm mt-8 px-4 py-8 text-center">
      <h1 className="font-serif text-3xl mb-4">Confirmation de paiement</h1>
      {currentOrderQuery.data?.status === 'paid' && (
        <>
          <p>Votre paiement a bien été pris en compte.</p>
          <p className="mt-2">
            <span className="font-bold">Merci</span> pour votre commande !
          </p>
          <WebsiteSurvey onSubmited={goBackToHome} />
        </>
      )}
      {currentOrderQuery.data?.status === 'waitingBankTransfer' && (
        <>
          <p>Les instructions pour effectuer votre virement vous ont été envoyées par email.</p>
          <p className="mt-2">
            <span className="font-bold">Merci</span> pour votre commande !
          </p>
          <WebsiteSurvey onSubmited={goBackToHome} />
        </>
      )}
      {currentOrderQuery.data?.status === 'draft' && (
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
          (currentOrderQuery.isPending || currentOrderQuery.data?.status === 'draft')
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
                    Si vous avez la moindre question, n'hésitez pas à nous contacter directement par instagram ou email.
                  </p>
                  <button type="button" className="btn-primary mx-auto mt-4" onClick={() => setWarningDismissed(true)}>
                    Fermer
                  </button>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
