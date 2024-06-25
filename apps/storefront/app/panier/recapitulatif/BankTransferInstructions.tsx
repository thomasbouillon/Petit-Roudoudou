import { useFormContext, useFormState, useWatch } from 'react-hook-form';
import { FinalizeFormType } from './page';
import {
  CloseButton,
  Dialog,
  DialogPanel,
  Popover,
  PopoverButton,
  PopoverOverlay,
  PopoverPanel,
  Transition,
  TransitionChild,
  useClose,
} from '@headlessui/react';
import React from 'react';
import clsx from 'clsx';

export default function BankTransferInstructions() {
  const paymentMethod = useWatch<FinalizeFormType, 'payment.method'>({ name: 'payment.method' });
  const { errors } = useFormState<FinalizeFormType>({
    name: 'payment.bankTransferInstructions',
  });
  const [show, setShow] = React.useState(false);

  if (paymentMethod !== 'bank-transfer') return null;

  return (
    <>
      <button type="button" className="btn-secondary mx-auto" onClick={() => setShow(true)}>
        Lire et accepter les instructions
      </button>
      <Transition show={show}>
        <Dialog onClose={() => setShow(false)} className="z-20">
          <TransitionChild
            enter="transition-opacity duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          </TransitionChild>
          {/* <PopoverButton className="btn-primary mx-auto mt-4">Lire et accepter les instructions</PopoverButton> */}
          {/* <Transition
          enter="transition-opacity duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        > */}
          {/* <PopoverOverlay className="fixed inset-0 bg-black bg-opacity-30 z-20" /> */}
          {/* </Transition>
        <Transition
          as="div"
          enter="transition-transform duration-200"
          enterFrom="scale-95"
          enterTo="scale-100"
          leave="transition-transform duration-200"
          leaveFrom="scale-100"
          leaveTo="scale-95"
        > */}
          <TransitionChild
            enter="transition-transform duration-200"
            enterFrom="scale-95"
            enterTo="scale-100"
            leave="transition-transform duration-200"
            leaveFrom="scale-100"
            leaveTo="scale-95"
          >
            <DialogPanel className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-sm max-w-prose z-20 p-4 space-y-4">
              <DialogPanelContent />
            </DialogPanel>
          </TransitionChild>
        </Dialog>
      </Transition>
      {errors.payment?.bankTransferInstructions && (
        <p className="text-red-500 text-sm text-center mt-2">Tu dois accepter les conditions pour continuer</p>
      )}
    </>
  );
}

function DialogPanelContent() {
  const { register, control } = useFormContext<FinalizeFormType>();
  const accepted = useWatch({
    control,
    name: 'payment.bankTransferInstructions',
  });

  const close = useClose();

  return (
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
        className={clsx('btn-primary mx-auto', !accepted && 'bg-opacity-50')}
        disabled={!accepted}
        onClick={() => close()}
        type="button"
      >
        Continuer
      </button>
    </>
  );
}
