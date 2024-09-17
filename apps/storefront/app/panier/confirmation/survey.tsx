'use client';

import { Survey } from '../../(components)/Survey';
import { usePostHog } from 'posthog-js/react';
import { useQuery } from '@tanstack/react-query';
import { PostHog, Survey as SurveyConfig } from 'posthog-js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/solid';

const fetchSurvey = (postHog: PostHog) => {
  return new Promise<SurveyConfig | null>((resolve) =>
    postHog.getActiveMatchingSurveys((res) => {
      const config = res.find((survey) => survey.name === 'website-survey');
      console.log(res);
      if (!config) {
        return null;
      }
      resolve(config);
    })
  );
};

type Props = {
  onSubmited: () => void;
};

export default function WebsiteSurvey({ onSubmited }: Props) {
  const postHog = usePostHog();

  const [showSurvey, setShowSurvey] = useState(false);

  const surveyQuery = useQuery({
    queryKey: ['surveys', 'website'],
    queryFn: () => fetchSurvey(postHog),
  });

  const sendAnswers = useMemo(
    () => (data: Record<string, string | number>) => {
      if (!surveyQuery.data) return;
      postHog.capture('survey sent', {
        $survey_id: surveyQuery.data.id,
        ...Object.entries(data).reduce((acc, [key, value]) => ({ ...acc, ['$survey_response_' + key]: value }), {}),
      });
      onSubmited();
    },
    [postHog, surveyQuery.data, onSubmited]
  );

  useEffect(() => {
    if (!surveyQuery.data) return;
    postHog.capture('survey shown', { $survey_id: surveyQuery.data.id });
  }, [postHog, surveyQuery.data]);

  const onSurveyDismissed = () => {
    if (!surveyQuery.data) return;
    postHog.capture('survey dismissed', { $survey_id: surveyQuery.data.id });
  };

  const close = useCallback(() => {
    setShowSurvey(false);
  }, []);

  if (surveyQuery.isError) throw surveyQuery.error;
  if (surveyQuery.isPending) {
    return null;
  }

  if (!surveyQuery.data) {
    return (
      <button className="btn-primary mx-auto mt-4" onClick={onSubmited}>
        Continuer
      </button>
    );
  }

  return (
    <>
      <button className="btn-primary mx-auto mt-4" onClick={() => setShowSurvey(true)}>
        Continuer
      </button>
      <Dialog onClose={close} open={showSurvey}>
        <div className="fixed top-0 left-0 w-screen h-[100dvh] bg-white z-10">
          <DialogPanel className="flex flex-col justify-center h-full max-w-md mx-auto">
            <div className="relative mb-4">
              <DialogTitle className="text-center text-xl font-bold px-8">Nous avons besoin de toi</DialogTitle>
              <button
                onClick={() => {
                  onSurveyDismissed();
                  setShowSurvey(false);
                  onSubmited();
                }}
                className="absolute right-0 top-1/2 -translate-y-1/2"
              >
                <XMarkIcon className="h-6 w-6" />
                <span className="sr-only">Fermer</span>
              </button>
            </div>
            <Survey surveyConfig={surveyQuery.data as any} onSubmit={sendAnswers} />
          </DialogPanel>
        </div>
      </Dialog>
      {/* <Survey surveyConfig={surveyQuery.data as any} onSubmit={sendAnswers} /> */}
    </>
  );
}
