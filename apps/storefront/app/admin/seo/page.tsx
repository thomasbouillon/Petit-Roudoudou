'use client';

import Link from 'next/link';
import { routes } from '@couture-next/routing';
import { trpc } from 'apps/storefront/trpc-client';
import { Form } from './seoFields';
export default function Page() {
  const { data: articles, error } = trpc.articles.list.useQuery();
  if (error) throw error;
  if (articles === undefined) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-3xl font-serif text-center mb-8">SEO</h1>
      <div className="border rounded-md shadow-md mx-auto max-w-4xl w-full">
        <Form></Form>
      </div>
    </div>
  );
}
