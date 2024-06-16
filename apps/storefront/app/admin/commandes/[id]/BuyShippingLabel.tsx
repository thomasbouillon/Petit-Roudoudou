import { ButtonWithLoading } from '@couture-next/ui/ButtonWithLoading';
import { Field } from '@couture-next/ui/form/Field';
import { Description, Dialog, DialogPanel, DialogTitle, Transition } from '@headlessui/react';
import { trpc } from 'apps/storefront/trpc-client';
import { useCallback, useMemo, useState } from 'react';
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
  const sendAtOptions = useMemo(() => {
    const options = [
      {
        label: "Aujourd'hui",
        value: new Date().toISOString(),
      },
    ];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i + 1);
      options.push({
        label: date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }),
        value: date.toISOString(),
      });
    }
    return options;
  }, []);

  const [sendAt, setSendAt] = useState(sendAtOptions[0].value);

  const onClick = useCallback(async () => {
    await buyShippingLabelMutation
      .mutateAsync({
        orderId,
        sendAt: new Date(sendAt),
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
          <DialogPanel className="space-y-4 max-w-sm border p-4">
            <DialogTitle className="text-xl font-serif text-center">Acheter bordereau d'expédition</DialogTitle>
            <Description className="">Veux tu vraiment acheter le bordereau auprès de Boxtal ?</Description>
            <div>
              <Field
                label="Date d'envoi"
                widgetId="send-at"
                labelClassName="!items-start"
                renderWidget={(className) => (
                  <select id="send-at" value={sendAt} onChange={(e) => setSendAt(e.target.value)} className={className}>
                    {sendAtOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>
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
