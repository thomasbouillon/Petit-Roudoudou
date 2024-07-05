'use client';

import { routes } from '@couture-next/routing';
import { Dialog, DialogPanel, Popover, PopoverButton, PopoverPanel, Transition } from '@headlessui/react';
import { useAuth } from 'apps/storefront/contexts/AuthContext';
import { trpc } from 'apps/storefront/trpc-client';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import Form, { FormData } from './Form';

type Props = {
  workshopSessionId: string;
  endAt: Date;
};

export default function BookSessionButton({ workshopSessionId, endAt }: Props) {
  const { userQuery } = useAuth();

  const generatePayByCardUrlMutation = trpc.payments.createWorkshopSessionPayByCardUrl.useMutation();
  const [shouldShowForm, setShouldShowForm] = useState(false);

  const handleBookSession = useCallback(
    async (data: FormData) => {
      const paymentUrl = await generatePayByCardUrlMutation.mutateAsync({ workshopSessionId, billing: data });
      window.location.href = paymentUrl;
    },
    [generatePayByCardUrlMutation, workshopSessionId]
  );

  if (endAt < new Date()) return <p>Cet atelier est déjà terminé</p>;

  if (!userQuery.data || userQuery.data.role === 'ANONYMOUS')
    return (
      <Popover>
        <PopoverButton className="btn-primary">Réserver</PopoverButton>
        <Transition
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <PopoverPanel anchor="top" className="bg-white p-4 shadow-md [--anchor-gap:0.5rem] [--anchor-padding:0.5rem]">
            <p>Vous devez être connecté pour réserver un atelier</p>
            <Link href={routes().auth().login(routes().workshopSessions())} className="btn-primary mx-auto mt-4">
              Se connecter
            </Link>
          </PopoverPanel>
        </Transition>
      </Popover>
    );

  return (
    <div>
      <button onClick={() => setShouldShowForm(true)} className="btn-primary">
        Réserver
      </button>
      <Dialog
        open={shouldShowForm}
        onClose={() => setShouldShowForm(false)}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="fixed top-0 left-0 w-screen bottom-0 bg-black bg-opacity-30 overflow-y-auto sm:flex sm:items-center sm:justify-center">
          <DialogPanel className="bg-white p-4 pt-20 sm:pt-6 shadow-md sm:max-w-md w-screen min-h-full sm:w-auto sm:min-h-0">
            <h2 className="text-2xl font-serif mb-6 text-center">Réserver un atelier</h2>
            <Form onSubmit={handleBookSession} />
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
