export const PRODUCT_SYSTEM_TABS = [
  { code: 'images', label: 'Images', type: 'system' as const },
  { code: 'description', label: 'Description', type: 'system' as const },
  { code: 'variants', label: 'Variants', type: 'system' as const },
] as const;

export type ProductSystemTab = (typeof PRODUCT_SYSTEM_TABS)[number];
