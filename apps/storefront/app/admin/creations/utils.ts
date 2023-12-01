import slugify from 'slugify';

export const createSlugFromTitle = (title: string) =>
  title ? slugify(title, { lower: true }) : '';
