import { Article as ArticleInOrm } from '@prisma/client';

export type Article = Omit<ArticleInOrm, 'skus' | 'stocks'> & {
  skus: (Omit<ArticleInOrm['skus'][number], 'characteristics'> & {
    // json override in types not working, tmp fix
    // https://github.com/arthurfiorette/prisma-json-types-generator/issues/303
    characteristics: PrismaJson.SkuCharacteristics;
  })[];
  stocks: (Omit<ArticleInOrm['stocks'][number], 'inherits'> & {
    inherits: Omit<ArticleInOrm['stocks'][number]['inherits'], 'customizables'> & {
      customizables: PrismaJson.ArticleStockInheritsCustomizables;
    };
  })[];
};

export type Customizable = PrismaJson.ArticleCustomizables[number];

export type Sku = Article['skus'][number];
