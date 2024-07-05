import { trpc } from 'apps/storefront/trpc-server';

type Props = {
  params: {
    id: string;
  };
};

export default async function Page({ params: { id: workshopId } }: Props) {
  const workshop = await trpc.workshopSessions.findById.query(workshopId);

  return (
    <>
      <h1 className="text-3xl font-serif text-center mb-8">Participants</h1>
      <p className="text-center">
        {workshop?.title} (
        {workshop?.startDate.toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
        )
      </p>
      <ul className="border rounded-md shadow-md mx-auto max-w-md w-full mt-4">
        {workshop?.attendees.map((attendee) => (
          <li key={attendee.id} className="border-b flex">
            <div className="px-8 py-4 block grow">
              {attendee.firstName} {attendee.lastName}
            </div>
          </li>
        ))}
        {workshop?.attendees.length === 0 && <li className="px-8 py-4 block border-b">Aucun participant</li>}
      </ul>
    </>
  );
}
