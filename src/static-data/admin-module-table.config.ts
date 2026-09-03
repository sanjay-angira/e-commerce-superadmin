import {
  AttributeComponentColumns,
  BannerComponentColumns,
  BlogCategoryComponentColumns,
  BlogComponentColumns,
  BlogTagComponentColumns,
  BrandComponentColumns,
  CategoryComponentColumns,
  CmsPagesComponentColumns,
  ContactUsLeadsColumns,
  CouponComponentColumns,
  OffersAndDealsColumns,
  OrdersComponentColumns,
  ProductComponentColumns,
  ProductFaqComponentColumns,
  ReviewsComponentColumns,
  RolesComponentColumns,
  UserComponentColumns,
  WebsiteLayoutColumns,
  type AdminTableColumnDefinition,
} from './static-common-table-columns';

export type AdminModuleAction = 'add' | 'view' | 'edit' | 'delete';

export type AdminModuleKey =
  | 'products'
  | 'categories'
  | 'brands'
  | 'attributes'
  | 'offers'
  | 'coupons'
  | 'banners'
  | 'cms-pages'
  | 'blogs'
  | 'blog-categories'
  | 'blog-tags'
  | 'reviews'
  | 'website-layout'
  | 'users'
  | 'customers'
  | 'delete-requests'
  | 'product-reviews'
  | 'product-faq'
  | 'contact-us-leads'
  | 'orders'
  | 'user-roles';

export type AdminFormField = {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'email' | 'password' | 'toggle' | 'select' | 'date';
  required?: boolean;
  options?: { label: string; value: string | number | boolean }[];
};

export type AdminModuleTableConfig = {
  label: string;
  description?: string;
  apiPath?: string;
  sortColumn?: string;
  columns: AdminTableColumnDefinition[];
  actions: AdminModuleAction[];
  addLabel?: string;
  /** Dedicated route instead of generic CRUD */
  customRoute?: boolean;
  formFields?: AdminFormField[];
};

export const adminModuleTableConfig: Record<AdminModuleKey, AdminModuleTableConfig> = {
  products: {
    label: 'Products',
    description: 'Manage your product catalog',
    columns: ProductComponentColumns,
    actions: ['add', 'view', 'edit', 'delete'],
    addLabel: 'Add product',
    formFields: [
      { key: 'productName', label: 'Product Name', type: 'text', required: true },
      { key: 'slug', label: 'Slug', type: 'text', required: true },
      { key: 'shortDescription', label: 'Short Description', type: 'textarea' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'isActive', label: 'Active', type: 'toggle' },
    ],
  },
  categories: {
    label: 'Categories',
    description: 'Manage product categories',
    columns: CategoryComponentColumns,
    actions: ['add', 'view', 'edit', 'delete'],
    addLabel: 'Add category',
    formFields: [
      { key: 'categoryName', label: 'Category Name', type: 'text', required: true },
      { key: 'slug', label: 'Slug', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'isActive', label: 'Active', type: 'toggle' },
    ],
  },
  brands: {
    label: 'Brands',
    description: 'Manage product brands',
    columns: BrandComponentColumns,
    actions: ['add', 'view', 'edit', 'delete'],
    addLabel: 'Add brand',
    formFields: [
      { key: 'brandName', label: 'Brand Name', type: 'text', required: true },
      { key: 'slug', label: 'Slug', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'website', label: 'Website', type: 'text' },
      { key: 'isActive', label: 'Active', type: 'toggle' },
    ],
  },
  attributes: {
    label: 'Attributes',
    description: 'Manage product attributes',
    columns: AttributeComponentColumns,
    actions: ['add', 'view', 'edit', 'delete'],
    addLabel: 'Add attribute',
    formFields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'isFilterable', label: 'Filterable', type: 'toggle' },
      { key: 'isRequired', label: 'Required', type: 'toggle' },
      { key: 'supportsImage', label: 'Supports Image', type: 'toggle' },
    ],
  },
  offers: {
    label: 'Offers & Deals',
    description: 'Manage promotional offers and deals',
    columns: OffersAndDealsColumns,
    actions: ['add', 'view', 'edit', 'delete'],
    addLabel: 'Add offer',
    formFields: [
      { key: 'offerName', label: 'Offer Name', type: 'text', required: true },
      { key: 'slug', label: 'Slug', type: 'text', required: true },
      {
        key: 'discountType',
        label: 'Discount Type',
        type: 'select',
        options: [
          { label: 'Percentage', value: 'percentage' },
          { label: 'Fixed', value: 'fixed' },
        ],
      },
      { key: 'discountValue', label: 'Discount Value', type: 'number', required: true },
      { key: 'startDate', label: 'Start Date', type: 'date' },
      { key: 'endDate', label: 'End Date', type: 'date' },
      { key: 'isActive', label: 'Active', type: 'toggle' },
    ],
  },
  coupons: {
    label: 'Coupons',
    description: 'Manage discount coupons',
    columns: CouponComponentColumns,
    actions: ['add', 'view', 'edit', 'delete'],
    addLabel: 'Add coupon',
    formFields: [
      { key: 'couponCode', label: 'Coupon Code', type: 'text', required: true },
      {
        key: 'discountType',
        label: 'Discount Type',
        type: 'select',
        options: [
          { label: 'Percentage', value: 'percentage' },
          { label: 'Fixed', value: 'fixed' },
        ],
      },
      { key: 'discountValue', label: 'Discount Value', type: 'number', required: true },
      { key: 'startDate', label: 'Start Date', type: 'date' },
      { key: 'endDate', label: 'End Date', type: 'date' },
      { key: 'isActive', label: 'Active', type: 'toggle' },
    ],
  },
  banners: {
    label: 'Banners',
    description: 'Manage homepage banners',
    columns: BannerComponentColumns,
    actions: ['add', 'view', 'edit', 'delete'],
    addLabel: 'Add banner',
    formFields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'subtitle', label: 'Subtitle', type: 'text' },
      { key: 'link', label: 'Link', type: 'text' },
      { key: 'image', label: 'Desktop Image URL', type: 'text' },
      { key: 'mobileImage', label: 'Mobile Image URL', type: 'text' },
      { key: 'position', label: 'Position', type: 'number' },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
        ],
      },
    ],
  },
  blogs: {
    label: 'Blog Posts',
    description: 'Manage blog posts',
    columns: BlogComponentColumns,
    actions: ['add', 'view', 'edit', 'delete'],
    addLabel: 'Add post',
    formFields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'slug', label: 'Slug', type: 'text', required: true },
      { key: 'content', label: 'Content', type: 'textarea' },
      { key: 'isActive', label: 'Active', type: 'toggle' },
    ],
  },
  'blog-categories': {
    label: 'Blog Categories',
    description: 'Manage blog categories',
    columns: BlogCategoryComponentColumns,
    actions: ['add', 'view', 'edit', 'delete'],
    addLabel: 'Add category',
    formFields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'slug', label: 'Slug', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'isActive', label: 'Active', type: 'toggle' },
    ],
  },
  'blog-tags': {
    label: 'Blog Tags',
    description: 'Manage blog tags',
    columns: BlogTagComponentColumns,
    actions: ['add', 'view', 'edit', 'delete'],
    addLabel: 'Add tag',
    formFields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'slug', label: 'Slug', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'isActive', label: 'Active', type: 'toggle' },
    ],
  },
  reviews: {
    label: 'Reviews',
    description: 'Manage product reviews',
    apiPath: 'reviews',
    columns: ReviewsComponentColumns,
    actions: ['add', 'view', 'edit', 'delete'],
    addLabel: 'Add review',
    formFields: [
      { key: 'comment', label: 'Comment', type: 'textarea', required: true },
      { key: 'rating', label: 'Rating', type: 'number' },
      { key: 'isApproved', label: 'Approved', type: 'toggle' },
    ],
  },
  'product-reviews': {
    label: 'Product Reviews',
    description: 'Manage product reviews',
    apiPath: 'reviews',
    columns: ReviewsComponentColumns,
    actions: ['add', 'view', 'edit', 'delete'],
    addLabel: 'Add review',
    formFields: [
      { key: 'comment', label: 'Comment', type: 'textarea', required: true },
      { key: 'rating', label: 'Rating', type: 'number' },
      { key: 'isApproved', label: 'Approved', type: 'toggle' },
    ],
  },
  'product-faq': {
    label: 'Product FAQs',
    description: 'Manage product FAQs',
    apiPath: 'faqs',
    columns: ProductFaqComponentColumns,
    actions: ['add', 'view', 'edit', 'delete'],
    addLabel: 'Add FAQ',
    formFields: [
      { key: 'question', label: 'Question', type: 'text', required: true },
      { key: 'answer', label: 'Answer', type: 'textarea', required: true },
      { key: 'isActive', label: 'Active', type: 'toggle' },
    ],
  },
  users: {
    label: 'Users',
    description: 'View admin user accounts',
    columns: UserComponentColumns,
    actions: ['add', 'view', 'edit', 'delete'],
    addLabel: 'Add user',
    formFields: [
      { key: 'firstName', label: 'First Name', type: 'text', required: true },
      { key: 'lastName', label: 'Last Name', type: 'text' },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'phoneNumber', label: 'Phone', type: 'text' },
      { key: 'password', label: 'Password', type: 'password' },
      { key: 'isActive', label: 'Active', type: 'toggle' },
    ],
  },
  customers: {
    label: 'Users',
    description: 'View admin user accounts',
    apiPath: 'users',
    columns: UserComponentColumns,
    actions: ['add', 'view', 'edit', 'delete'],
    addLabel: 'Add user',
    formFields: [
      { key: 'firstName', label: 'First Name', type: 'text', required: true },
      { key: 'lastName', label: 'Last Name', type: 'text' },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'phoneNumber', label: 'Phone', type: 'text' },
      { key: 'password', label: 'Password', type: 'password' },
      { key: 'isActive', label: 'Active', type: 'toggle' },
    ],
  },
  'delete-requests': {
    label: 'Delete Requests',
    description: 'Manage account deletion requests',
    apiPath: 'users/delete-requests',
    sortColumn: 'updatedAt',
    columns: UserComponentColumns,
    actions: ['delete'],
  },
  'contact-us-leads': {
    label: 'Contact Us Leads',
    description: 'Manage contact form leads',
    columns: ContactUsLeadsColumns,
    actions: ['view', 'edit', 'delete'],
    formFields: [
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { label: 'New', value: 'new' },
          { label: 'Contacted', value: 'contacted' },
          { label: 'Resolved', value: 'resolved' },
        ],
      },
    ],
  },
  orders: {
    label: 'Orders',
    description: 'View customer orders and products',
    apiPath: 'orders',
    sortColumn: 'createdAt',
    columns: OrdersComponentColumns,
    actions: ['view'],
  },
  'cms-pages': {
    label: 'CMS Pages',
    description: 'Manage static content pages',
    apiPath: 'cms-pages',
    columns: CmsPagesComponentColumns,
    actions: ['add', 'view', 'edit', 'delete'],
    addLabel: 'Add page',
    formFields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'slug', label: 'Slug', type: 'text', required: true },
      { key: 'content', label: 'Content', type: 'textarea' },
      { key: 'isActive', label: 'Active', type: 'toggle' },
    ],
  },
  'website-layout': {
    label: 'Website Layout',
    description: 'Manage homepage sections',
    apiPath: 'cms-sections',
    columns: WebsiteLayoutColumns,
    actions: ['add', 'view', 'edit', 'delete'],
    addLabel: 'Add section',
    customRoute: true,
  },
  'user-roles': {
    label: 'User Roles',
    description: 'Manage roles',
    apiPath: 'roles',
    columns: RolesComponentColumns,
    actions: ['add', 'view', 'edit', 'delete'],
    addLabel: 'Add role',
    formFields: [
      { key: 'roleName', label: 'Role Name', type: 'text', required: true },
      { key: 'roleId', label: 'Role Id', type: 'number', required: true },
    ],
  },
};

export function getAdminModuleTableConfig(module: string) {
  if (!(module in adminModuleTableConfig)) return null;
  return adminModuleTableConfig[module as AdminModuleKey];
}

export function getAdminModuleApiPath(module: AdminModuleKey): string {
  const config = adminModuleTableConfig[module];
  return config.apiPath ?? module;
}

export function isAdminModuleKey(module: string): module is AdminModuleKey {
  return module in adminModuleTableConfig;
}
