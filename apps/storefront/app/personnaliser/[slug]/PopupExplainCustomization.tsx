import {
  CloseButton,
  Popover,
  PopoverButton,
  PopoverOverlay,
  PopoverPanel,
  Transition,
  TransitionChild,
} from '@headlessui/react';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/solid';
import RandomButtonImg from '../../../assets/explainations/random-button-example.png';
import FabricButtonImg from '../../../assets/explainations/fabric-button-example.png';
import Image from 'next/image';

export function PopupExplainCustomization() {
  return (
    <Popover>
      <PopoverButton className="text-primary-100 border-primary-100 border-2 px-4 py-2 block mt-4 bg-light-100">
        <span className="sr-only">Comment ca marche ?</span>
        <QuestionMarkCircleIcon className="w-6 h-6" />
      </PopoverButton>
      <Transition>
        <TransitionChild
          enter="transition ease-out duration-200"
          enterFrom="opacity-0 translate-y-1"
          enterTo="opacity-100 translate-y-0"
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 translate-y-1"
        >
          <PopoverOverlay className="fixed inset-0 bg-black bg-opacity-30" />
        </TransitionChild>
        <TransitionChild
          enter="transition-transform duration-200"
          enterFrom="scale-95"
          enterTo="scale-100"
          leave="transition-transform duration-150"
          leaveFrom="scale-100"
          leaveTo="scale-95"
        >
          <PopoverPanel
            modal
            className="fixed w-[90vw] max-w-lg mt-2 top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 z-50 bg-white rounded-lg shadow-lg"
          >
            <div className="p-4 flex flex-col h-full">
              <h2 className="font-serif text-2xl text-center">Comment ça marche ?</h2>
              <div className="grow">
                <p className="mt-4">
                  <ol className="list-inside list-disc space-y-4">
                    <li>
                      Clique sur
                      <Image src={FabricButtonImg} alt="Bouton aléatoire" className="inline-block mx-2" />
                      pour sélectioner le tissu de ton choix. Il apparaitra sur le modèle pour t'aider à créer ton
                      bonheur.
                    </li>
                    <li>
                      Clique sur
                      <Image src={RandomButtonImg} alt="Bouton aléatoire" className="inline-block mx-2" />
                      pour un brin de folie !
                    </li>
                  </ol>
                </p>
                <p className="text-primary-100 font-bold mt-8">
                  Lorsque tu as terminé ta sélection, clique sur "continuer" 😎
                </p>
              </div>

              <CloseButton className="btn-primary mt-4 w-full">Fermer</CloseButton>
            </div>
          </PopoverPanel>
        </TransitionChild>
      </Transition>
    </Popover>
  );
}
