const TAXES = 0;

export const applyTaxes = (price: number) => Math.round((price + Number.EPSILON) * (1 + TAXES) * 100) / 100;

export const removeTaxes = (price: number) => Math.round(((price + Number.EPSILON) / (1 + TAXES)) * 100) / 100;

export const getTaxes = (price: number) => Math.round((price + Number.EPSILON) * TAXES * 100) / 100;
