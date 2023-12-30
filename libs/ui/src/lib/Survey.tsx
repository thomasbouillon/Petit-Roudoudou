'use client';

import clsx from 'clsx';
import type { BasicSurveyQuestion, RatingSurveyQuestion, Survey, SurveyAppearance, SurveyQuestion } from 'posthog-js';
import React, { useState } from 'react';
import { z } from 'zod';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.record(z.string().min(1));

type Props = {
  surveyConfig: Survey;
  onSubmit: (data: Record<string, string>) => void;
};

export function Survey({ surveyConfig, onSubmit }: Props) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const form = useForm<Record<string, string>>({
    resolver: zodResolver(schema),
  });

  const handleSubmit = form.handleSubmit((data) => {
    console.log(data);
    onSubmit(data);
  });

  const canGoToNextQuestion = ![undefined, ''].includes(form.watch(`${currentQuestionIndex}`) as any);

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit}>
        <h2 className="sr-only">{surveyConfig.name}</h2>
        <p className="empty:hidden">{surveyConfig.description}</p>
        {currentQuestionIndex < surveyConfig.questions.length && (
          <>
            <Question question={surveyConfig.questions[currentQuestionIndex]} questionUid={currentQuestionIndex} />
            <button
              type="button"
              className={clsx('btn-primary mx-auto mt-6', !canGoToNextQuestion && 'opacity-50 cursor-not-allowed')}
              onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
              disabled={!canGoToNextQuestion}
            >
              Suivant
            </button>
          </>
        )}
        {currentQuestionIndex >= surveyConfig.questions.length && (
          <>
            <Thanks {...surveyConfig.appearance} />
            <button type="submit" className="btn-primary mx-auto mt-6">
              Envoyer
            </button>
          </>
        )}
      </form>
    </FormProvider>
  );
}

const Question: React.FC<{ question: SurveyQuestion; questionUid: number }> = ({ question, questionUid }) => {
  switch (question.type) {
    case 'open':
      return <TextField question={question} questionUid={questionUid.toString()} />;
    case 'rating':
      return <RatingField question={question} questionUid={questionUid.toString()} />;
    default:
      return null;
  }
};

const Thanks: React.FC<SurveyAppearance> = (appearance) => {
  return (
    <div className="font-bold">
      <p className="text-center">{appearance.thankYouMessageHeader}</p>
    </div>
  );
};

const TextField: React.FC<{ question: BasicSurveyQuestion; questionUid: string }> = ({ question, questionUid }) => {
  const { register } = useFormContext();
  return (
    <div>
      <label htmlFor="answer" className="mb-4 block">
        {question.question}
      </label>
      <textarea className="w-full border rounded-sm p-2" rows={5} id="answer" {...register(questionUid)} />
    </div>
  );
};

const RatingField: React.FC<{ question: RatingSurveyQuestion; questionUid: string }> = ({ question, questionUid }) => {
  const { setValue } = useFormContext();

  return (
    <div>
      <label htmlFor="answer" className="mb-4 block">
        {question.question}
      </label>
      <div className={clsx('grid text-white gap-2')}>
        {Array.from({ length: question.scale }, (_, i) => (
          <button
            key={i}
            type="button"
            className="bg-primary-100 py-2 w-full row-start-1 "
            onClick={() => setValue(questionUid, (i + 1).toString(), { shouldValidate: true })}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <div className="flex justify-between">
        <p className="empty:hidden">{question.lowerBoundLabel}</p>
        <p className="empty:hidden">{question.upperBoundLabel}</p>
      </div>
    </div>
  );
};
