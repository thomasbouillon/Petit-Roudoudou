'use client';

import { Survey } from '@couture-next/ui';
import { usePostHog } from 'posthog-js/react';
import { useQuery } from '@tanstack/react-query';
import { PostHog, Survey as SurveyConfig, SurveyQuestionType, SurveyType } from 'posthog-js';
import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { routes } from '@couture-next/routing';

const fetchSurvey = (postHog: PostHog) => {
  return new Promise<SurveyConfig | null>((resolve) =>
    postHog.getActiveMatchingSurveys((res) => {
      const config = res.find((survey) => survey.name === 'website-survey');
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

  const surveyQuery = useQuery({
    queryKey: ['surveys', 'website'],
    queryFn: () => fetchSurvey(postHog),
  });

  const sendAnswers = useMemo(
    () => (data: Record<string, string>) => {
      if (!surveyQuery.data) return;
      postHog.capture('survey sent', {
        $survey_id: surveyQuery.data.id,
        ...Object.entries(data).reduce((acc, [key, value]) => ({ ...acc, ['$survey_response_' + key]: value }), {}),
      });
      onSubmited();
    },
    [postHog, surveyQuery.data]
  );

  useEffect(() => {
    if (!surveyQuery.data) return;
    postHog.capture('survey shown', { $survey_id: surveyQuery.data.id });
  }, [postHog, surveyQuery.data]);

  const onSuveyDismissed = () => {
    if (!surveyQuery.data) return;
    console.log('DISMISSED');
    postHog.capture('survey dismissed', { $survey_id: surveyQuery.data.id });
  };

  if (surveyQuery.isError) throw surveyQuery.error;
  if (surveyQuery.isPending || !surveyQuery.data) {
    return null;
  }

  return (
    <>
      <div className="mt-6 mx-auto max-w-md text-start border p-4">
        <p className="font-bold">Nous avons besoin de vous !</p>
        <p>En effet, si êtes déjà venus sur le site, vous aurez surement remarqué qu'il s'est fait peau neuve.</p>
        <p>C'est pouquoi nous vous demandons de nous aider en répendant à ce rapide questionnaire annonyme.</p>
      </div>
      <div className="max-w-md mx-auto border mt-8 p-4">
        <Survey surveyConfig={surveyQuery.data} onSubmit={sendAnswers} />
      </div>
      <Link className="btn-light mx-auto py-2" href={routes().index()} onClick={onSuveyDismissed}>
        Je passe mon tour
      </Link>
    </>
  );
}
