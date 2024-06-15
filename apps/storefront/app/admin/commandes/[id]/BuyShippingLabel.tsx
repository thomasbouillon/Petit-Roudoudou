import { ButtonWithLoading } from '@couture-next/ui/ButtonWithLoading';
import { Description, Dialog, DialogPanel, DialogTitle, Transition } from '@headlessui/react';
import { trpc } from 'apps/storefront/trpc-client';
import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';

type Props = {
  orderId: string;
};

export default function BuyShippingLabel({ orderId }: Props) {
  const trpcUtils = trpc.useUtils();
  const buyShippingLabelMutation = trpc.orders.buyShippingLabel.useMutation({
    async onSuccess() {
      trpcUtils.orders.invalidate();
    },
  });

  const [showModal, setShowModal] = useState(false);

  const onClick = useCallback(async () => {
    await buyShippingLabelMutation
      .mutateAsync({
        orderId,
        sendAt: new Date(),
      })
      .then(() => {
        setShowModal(false);
      })
      .catch(() => {
        toast.error("Erreur lors de l'achat du bordereau d'expédition");
      });
  }, [buyShippingLabelMutation, orderId]);

  return (
    <div>
      <button type="button" onClick={() => setShowModal(true)} className="btn-light mx-auto">
        Acheter bordereau d'expédition
      </button>
      <Transition
        show={showModal}
        enter="transition-opacity duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-300"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <Dialog
          onClose={() => setShowModal(false)}
          className="fixed top-0 left-0 right-0 bottom-0 overflow-y-scroll w-full p-4 bg-white z-[101] flex justify-center items-center"
        >
          <DialogPanel className="space-y-4 max-w-sm">
            <DialogTitle className="text-xl font-serif text-center">Acheter bordereau d'expédition</DialogTitle>
            <Description className="text-center">
              Veux tu vraiment acheter un bordereau d'expédition pour cette commande ?
            </Description>
            <ButtonWithLoading
              loading={buyShippingLabelMutation.isPending}
              type="button"
              onClick={onClick}
              disabled={buyShippingLabelMutation.isPending}
              className="btn-primary mx-auto"
            >
              Acheter
            </ButtonWithLoading>
          </DialogPanel>
        </Dialog>
      </Transition>
    </div>
  );
}
