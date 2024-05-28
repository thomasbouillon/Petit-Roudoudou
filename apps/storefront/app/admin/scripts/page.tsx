import SyncShippingDetails from './SyncShippingDetails';

export default function Page() {
  return (
    <div className="max-w-md w-full px-4 mx-auto">
      <h1 className="text-3xl font-serif text-center mb-6">Commandes manuelles</h1>
      <div className="">
        <h2>Synchronisation des prix de livraison</h2>
        <SyncShippingDetails />
      </div>
    </div>
  );
}
