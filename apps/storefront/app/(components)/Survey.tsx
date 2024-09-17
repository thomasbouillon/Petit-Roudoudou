'use client';

import clsx from 'clsx';
import type {
  BasicSurveyQuestion,
  MultipleSurveyQuestion,
  RatingSurveyQuestion,
  Survey,
  SurveyQuestion,
} from 'posthog-js';
import React, { useState } from 'react';
import { z } from 'zod';
import { FormProvider, useController, useForm, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Field, Label, Radio, RadioGroup } from '@headlessui/react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

const schema = z.record(z.union([z.string().min(1), z.number()]));

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
    toast.success(surveyConfig.appearance?.thankYouMessageHeader ?? 'Merci pour ton retour !');
    onSubmit(data);
  });

  const canGoToNextQuestion = ![undefined, ''].includes(form.watch(`${currentQuestionIndex}`) as any);

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit}>
        <h2 className="sr-only">{surveyConfig.name}</h2>
        <p className="empty:hidden">{surveyConfig.description}</p>
        {currentQuestionIndex < surveyConfig.questions.length && (
          <Question question={surveyConfig.questions[currentQuestionIndex]} questionUid={currentQuestionIndex} />
        )}
        {currentQuestionIndex >= surveyConfig.questions.length - 1 ? (
          <button
            type="submit"
            className={clsx('btn-primary mx-auto mt-6', !canGoToNextQuestion && 'opacity-50 cursor-not-allowed')}
            disabled={!canGoToNextQuestion}
          >
            Envoyer
          </button>
        ) : (
          <button
            type="button"
            className={clsx('btn-primary mx-auto mt-6', !canGoToNextQuestion && 'opacity-50 cursor-not-allowed')}
            onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
            disabled={!canGoToNextQuestion}
          >
            Suivant
          </button>
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
    case 'single_choice':
      return <SingleChoiceField question={question} questionUid={questionUid.toString()} />;
    default:
      console.warn(`Unknown question type: ${question.type}`);
      return null;
  }
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
            onClick={() => setValue(questionUid, i + 1, { shouldValidate: true })}
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

const SingleChoiceField: React.FC<{ question: MultipleSurveyQuestion; questionUid: string }> = ({
  question,
  questionUid,
}) => {
  const { field } = useController({ name: questionUid });

  return (
    <div>
      <Field>
        <Label>{question.question}</Label>
        <RadioGroup {...field} className="grid gap-2">
          {question.choices.map((choice, i) => (
            <Radio
              key={i}
              value={choice}
              className="px-4 py-2 border rounded-sm group flex items-center justify-between"
            >
              {choice}
              <CheckCircleIcon className="h-6 w-6 text-primary-100 opacity-0 group-data-[checked]:opacity-100" />
            </Radio>
          ))}
        </RadioGroup>
      </Field>
    </div>
  );
};
