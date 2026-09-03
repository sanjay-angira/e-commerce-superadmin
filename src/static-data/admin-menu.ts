export type AdminMenuItem = {
  label: string;
  href: string;
  icon: string;
};

export type AdminMenuSection = {
  title: string;
  icon?: string;
  items: AdminMenuItem[];
};
