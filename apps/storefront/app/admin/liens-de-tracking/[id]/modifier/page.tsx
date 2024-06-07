import EditTrackingLinkForm from './EditTrackingLinkForm';
import DeleteButton from './DeleteButton';

type Props = {
  params: {
    id: string;
  };
};

export default function Page({ params }: Props) {
  return (
    <>
      <h1 className="text-5xl font-serif text-center">Modifier un lien</h1>
      <EditTrackingLinkForm trackingLinkId={params.id} />
      <DeleteButton trackingLinkId={params.id} />
    </>
  );
}
