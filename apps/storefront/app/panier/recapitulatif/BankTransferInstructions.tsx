import { useFormContext, useFormState, useWatch } from 'react-hook-form';
import { FinalizeFormType } from './page';
import { Popover, Transition } from '@headlessui/react';
import React from 'react';
import clsx from 'clsx';

export default function BankTransferInstructions() {
  const paymentMethod = useWatch<FinalizeFormType, 'payment.method'>({ name: 'payment.method' });
  const { errors } = useFormState<FinalizeFormType>({
    name: 'payment.bankTransferInstructions',
  });

  if (paymentMethod !== 'bank-transfer') return null;

  return (
    <>
      <Popover>
        <Popover.Button className="btn-primary mx-auto mt-4">Lire et accepter les instructions</Popover.Button>
        <Transition
          as={React.Fragment}
          enter="transition-opacity duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Popover.Overlay className="fixed inset-0 bg-black bg-opacity-30 z-20" />
        </Transition>
        <Transition
          enter="transition-opacity duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <PopoverPanel />
        </Transition>
      </Popover>
      {errors.payment?.bankTransferInstructions && (
        <p className="text-red-500 text-sm text-center mt-2">Tu dois accepter les conditions pour continuer</p>
      )}
    </>
  );
}

function PopoverPanel() {
  const { register, control } = useFormContext<FinalizeFormType>();
  const accepted = useWatch({
    control,
    name: 'payment.bankTransferInstructions',
  });
  return (
    <Popover.Panel className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-sm max-w-prose z-20 p-4 space-y-4">
      {({ close }) => (
        <>
          <h3 className="font-serif text-3xl text-center mb-6">Conditions</h3>
          <p>Tu recevras le RIB de l'entreprise par mail pour régler le montant de ta commande.</p>
          <p>
            Les delais de confections démarrent après la réception du virement (ou de 50% du paiement dans le cas d'un
            paiement en plusieurs fois).
          </p>
          <p>Plus de détails seront fournis avec les instructions de paiement par mail</p>
          <label className="block py-2 cursor-pointer">
            <input type="checkbox" className="mr-2" {...register('payment.bankTransferInstructions')}></input>
            J'ai lu et j'accepte les conditions de paiement
          </label>
          <button
            className={clsx('btn-primary mx-auto', !accepted && 'opacity-50')}
            disabled={!accepted}
            onClick={() => close()}
            type="button"
          >
            Continuer
          </button>
        </>
      )}
    </Popover.Panel>
  );
}
