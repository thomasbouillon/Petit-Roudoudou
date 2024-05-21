import { Article as ArticleInOrm } from '@prisma/client';

export type Article = Omit<ArticleInOrm, 'skus' | 'stocks' | 'customizableVariants'> & {
  skus: (Omit<ArticleInOrm['skus'][number], 'characteristics'> & {
    // json override in types not working, tmp fix
    // https://github.com/arthurfiorette/prisma-json-types-generator/issues/303
    characteristics: PrismaJson.SkuCharacteristics;
  })[];
  customizableVariants: (Omit<ArticleInOrm['customizableVariants'][number], 'customizableParts'> & {
    customizableParts: (Omit<ArticleInOrm['customizableVariants'][number]['customizableParts'][number], 'size'> & {
      size: PrismaJson.SizeTuple;
    })[];
  })[];
  stocks: (Omit<ArticleInOrm['stocks'][number], 'inherits'> & {
    inherits: Omit<ArticleInOrm['stocks'][number]['inherits'], 'customizables'> & {
      customizables: PrismaJson.ArticleStockInheritsCustomizables;
    };
  })[];
};

export type Option = PrismaJson.ArticleOptions[number];

export type PartOption = Option & {
  type: 'customizable-part';
};

export type Sku = Article['skus'][number];
