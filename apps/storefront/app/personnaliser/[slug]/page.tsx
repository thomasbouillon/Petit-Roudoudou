'use client';

import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from 'next/navigation';
import useArticle from '../../../hooks/useArticle';
import Image from 'next/image';
import { useCallback, useState } from 'react';
import ChooseSKU from './chooseSKU';
import ChooseOptions from './chooseOptions';

export default function Page() {
  const routeParams = useParams();
  const queryParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const [sku, setSku] = useState<string | null>(queryParams.get('sku'));
  const { query } = useArticle({ slug: routeParams.slug });

  const handleSKUSelected = useCallback(
    (skuId: string) => {
      setSku(skuId);
      const params = new URLSearchParams(queryParams.toString());
      params.set('sku', skuId);
      router.push(pathname + '?' + params.toString());
    },
    [queryParams, pathname, router]
  );

  if (query.isError) throw query.error;
  if (query.isLoading) return null;

  const article = query.data;

  return (
    <div>
      <h1 className="font-serif font-bold text-4xl text-center mb-4 mt-8">
        Personnaliser sa couverture
      </h1>
      <Image
        src={article.images[0].url}
        alt=""
        width={256}
        height={256}
        className="w-64 h-64 object-contain mx-auto mb-6"
      />
      <div className="flex justify-center">
        <div className="max-w-3xl w-full">
          {!sku && (
            <ChooseSKU article={article} onSKUSelected={handleSKUSelected} />
          )}
          {!!sku && <ChooseOptions className="mt-6" article={article} />}
        </div>
      </div>
    </div>
  );
}
