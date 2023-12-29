import { StyledWrapper } from '@couture-next/ui';
import Form from './form';

export default function Page() {
  return (
    <div className="my-8">
      <h1 className="text-center text-3xl font-serif mb-6">Nous contacter</h1>
      <div className="w-full max-w-prose mx-auto space-y-2">
        <p>
          Pour répondre aux questions les plus courantes, une page FAQ a été mise en place. Elle vous permet
          d&apos;avoir une réponse instantannée à vos questions.
        </p>
        <p>Si la réponse ne s&apos;y trouve pas nous vous invitons à écrire un mot via ce formulaire.</p>
        <p>Nous nous engageons à y répondre sous 48h</p>
      </div>
      <StyledWrapper className="bg-light-100">
        <Form />
      </StyledWrapper>
    </div>
  );
}
