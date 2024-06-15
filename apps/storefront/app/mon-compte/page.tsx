import { GiftCards } from './GiftCards';
import { ProfileDetailsForm } from './ProfileDetailsForm';
import { RecentOrders } from './RecentOrders';

export default function Page() {
  return (
    <div className="max-w-7xl mx-auto justify-center grid grid-cols-[repeat(auto-fill,minmax(8rem,28rem))] gap-4 p-4">
      <h1 className="text-3xl font-serif text-center col-span-full">Mon compte</h1>
      <div className="p-4 border rounded-sm">
        <ProfileDetailsForm />
      </div>
      <div className="p-4 border rounded-sm">
        <RecentOrders />
      </div>
      <div className="p-4 border rounded-sm">
        <GiftCards />
      </div>
    </div>
  );
}
