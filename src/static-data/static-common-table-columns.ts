/** Column definitions mirrored from vr-frontend staticAdminTableColumns / vr-admin */

export type AdminTableColumnDefinition = {
  label: string;
  property: string;
  type: string;
  datatype: string;
  visible: boolean;
};

export const UserComponentColumns: AdminTableColumnDefinition[] = [
  { label: 'ID', property: 'id', type: 'text', datatype: 'id', visible: true },
  { label: 'Name', property: 'name', type: 'text', datatype: 'name', visible: true },
  { label: 'Email', property: 'email', type: 'text', datatype: 'email', visible: true },
  { label: 'Phone Number', property: 'phoneNumber', type: 'text', datatype: 'phoneNumber', visible: true },
  { label: 'Roles', property: 'role', type: 'text', datatype: 'role', visible: true },
  { label: 'Status', property: 'isActive', type: 'text', datatype: 'status', visible: true },
  { label: 'Created On', property: 'createdAt', type: 'text', datatype: 'date', visible: true },
  { label: 'Updated On', property: 'updatedAt', type: 'text', datatype: 'date', visible: true },
  { label: 'Actions', property: 'actions', type: 'button', datatype: 'button', visible: true },
];

export const ProductComponentColumns: AdminTableColumnDefinition[] = [
  { label: 'ID', property: 'id', type: 'text', datatype: 'id', visible: true },
  { label: 'Product Name', property: 'productName', type: 'text', datatype: 'productName', visible: true },
  { label: 'Category', property: 'categoryName', type: 'text', datatype: 'categoryName', visible: true },
  { label: 'Brand', property: 'brandName', type: 'text', datatype: 'brandName', visible: true },
  { label: 'Status', property: 'isActive', type: 'text', datatype: 'status', visible: true },
  { label: 'Created On', property: 'createdAt', type: 'text', datatype: 'date', visible: true },
  { label: 'Updated On', property: 'updatedAt', type: 'text', datatype: 'date', visible: true },
  { label: 'Actions', property: 'actions', type: 'button', datatype: 'button', visible: true },
];

export const CategoryComponentColumns: AdminTableColumnDefinition[] = [
  { label: 'ID', property: 'id', type: 'text', datatype: 'id', visible: true },
  { label: 'Category Name', property: 'categoryName', type: 'text', datatype: 'categoryName', visible: true },
  { label: 'Parent Category', property: 'parentCategory', type: 'text', datatype: 'parentCategory', visible: true },
  { label: 'Status', property: 'isActive', type: 'text', datatype: 'status', visible: true },
  { label: 'Created On', property: 'createdAt', type: 'text', datatype: 'date', visible: true },
  { label: 'Updated On', property: 'updatedAt', type: 'text', datatype: 'date', visible: true },
  { label: 'Actions', property: 'actions', type: 'button', datatype: 'button', visible: true },
];

export const BrandComponentColumns: AdminTableColumnDefinition[] = [
  { label: 'ID', property: 'id', type: 'text', datatype: 'id', visible: true },
  { label: 'Brand Name', property: 'brandName', type: 'text', datatype: 'brandName', visible: true },
  { label: 'Status', property: 'isActive', type: 'text', datatype: 'status', visible: true },
  { label: 'Created On', property: 'createdAt', type: 'text', datatype: 'date', visible: true },
  { label: 'Updated On', property: 'updatedAt', type: 'text', datatype: 'date', visible: true },
  { label: 'Actions', property: 'actions', type: 'button', datatype: 'button', visible: true },
];

export const AttributeComponentColumns: AdminTableColumnDefinition[] = [
  { label: 'ID', property: 'id', type: 'text', datatype: 'id', visible: true },
  { label: 'Name', property: 'name', type: 'text', datatype: 'name', visible: true },
  { label: 'Filterable', property: 'isFilterable', type: 'text', datatype: 'on-off', visible: true },
  { label: 'Required', property: 'isRequired', type: 'text', datatype: 'on-off', visible: true },
  { label: 'Image / Swatch', property: 'supportsImage', type: 'text', datatype: 'on-off', visible: true },
  { label: 'Created On', property: 'createdAt', type: 'text', datatype: 'date', visible: true },
  { label: 'Updated On', property: 'updatedAt', type: 'text', datatype: 'date', visible: true },
  { label: 'Actions', property: 'actions', type: 'button', datatype: 'button', visible: true },
];

export const OffersAndDealsColumns: AdminTableColumnDefinition[] = [
  { label: 'ID', property: 'id', type: 'text', datatype: 'id', visible: true },
  { label: 'Offer Name', property: 'offerName', type: 'text', datatype: 'offerName', visible: true },
  { label: 'Discount Type', property: 'discountType', type: 'text', datatype: 'discountType', visible: true },
  { label: 'Discount Value', property: 'discountValue', type: 'text', datatype: 'discountValue', visible: true },
  { label: 'Start Date', property: 'startDate', type: 'text', datatype: 'time', visible: true },
  { label: 'End Date', property: 'endDate', type: 'text', datatype: 'time', visible: true },
  { label: 'Status', property: 'isActive', type: 'text', datatype: 'status', visible: true },
  { label: 'Created On', property: 'createdAt', type: 'text', datatype: 'date', visible: true },
  { label: 'Actions', property: 'actions', type: 'button', datatype: 'button', visible: true },
];

export const CouponComponentColumns: AdminTableColumnDefinition[] = [
  { label: 'ID', property: 'id', type: 'text', datatype: 'id', visible: true },
  { label: 'Coupon Code', property: 'couponCode', type: 'text', datatype: 'couponCode', visible: true },
  { label: 'Discount Type', property: 'discountType', type: 'text', datatype: 'discountType', visible: true },
  { label: 'Discount Value', property: 'discountValue', type: 'text', datatype: 'discountValue', visible: true },
  { label: 'Start Date', property: 'startDate', type: 'text', datatype: 'date', visible: true },
  { label: 'End Date', property: 'endDate', type: 'text', datatype: 'date', visible: true },
  { label: 'Status', property: 'isActive', type: 'text', datatype: 'status', visible: true },
  { label: 'Actions', property: 'actions', type: 'button', datatype: 'button', visible: true },
];

export const BannerComponentColumns: AdminTableColumnDefinition[] = [
  { label: 'ID', property: 'id', type: 'text', datatype: 'id', visible: true },
  { label: 'Title', property: 'title', type: 'text', datatype: 'title', visible: true },
  { label: 'Subtitle', property: 'subtitle', type: 'text', datatype: 'text', visible: true },
  { label: 'Position', property: 'position', type: 'text', datatype: 'text', visible: true },
  { label: 'Status', property: 'status', type: 'text', datatype: 'status', visible: true },
  { label: 'Created On', property: 'createdAt', type: 'text', datatype: 'date', visible: true },
  { label: 'Actions', property: 'actions', type: 'button', datatype: 'button', visible: true },
];

export const CmsPagesComponentColumns: AdminTableColumnDefinition[] = [
  { label: 'ID', property: 'id', type: 'text', datatype: 'id', visible: true },
  { label: 'Title', property: 'title', type: 'text', datatype: 'title', visible: true },
  { label: 'Slug', property: 'slug', type: 'text', datatype: 'slug', visible: true },
  { label: 'Status', property: 'isActive', type: 'text', datatype: 'status', visible: true },
  { label: 'Created On', property: 'createdAt', type: 'text', datatype: 'date', visible: true },
  { label: 'Actions', property: 'actions', type: 'button', datatype: 'button', visible: true },
];

export const BlogComponentColumns: AdminTableColumnDefinition[] = [
  { label: 'ID', property: 'id', type: 'text', datatype: 'id', visible: true },
  { label: 'Title', property: 'title', type: 'text', datatype: 'title', visible: true },
  { label: 'Category', property: 'categoryName', type: 'text', datatype: 'categoryName', visible: true },
  { label: 'Publish Status', property: 'publishStatus', type: 'text', datatype: 'publishStatus', visible: true },
  { label: 'Status', property: 'isActive', type: 'text', datatype: 'status', visible: true },
  { label: 'Created On', property: 'createdAt', type: 'text', datatype: 'date', visible: true },
  { label: 'Actions', property: 'actions', type: 'button', datatype: 'button', visible: true },
];

export const BlogCategoryComponentColumns: AdminTableColumnDefinition[] = [
  { label: 'ID', property: 'id', type: 'text', datatype: 'id', visible: true },
  { label: 'Title', property: 'title', type: 'text', datatype: 'title', visible: true },
  { label: 'Status', property: 'isActive', type: 'text', datatype: 'status', visible: true },
  { label: 'Created On', property: 'createdAt', type: 'text', datatype: 'date', visible: true },
  { label: 'Actions', property: 'actions', type: 'button', datatype: 'button', visible: true },
];

export const BlogTagComponentColumns: AdminTableColumnDefinition[] = [
  { label: 'ID', property: 'id', type: 'text', datatype: 'id', visible: true },
  { label: 'Title', property: 'title', type: 'text', datatype: 'title', visible: true },
  { label: 'Status', property: 'isActive', type: 'text', datatype: 'status', visible: true },
  { label: 'Created On', property: 'createdAt', type: 'text', datatype: 'date', visible: true },
  { label: 'Actions', property: 'actions', type: 'button', datatype: 'button', visible: true },
];

export const ReviewsComponentColumns: AdminTableColumnDefinition[] = [
  { label: 'ID', property: 'id', type: 'text', datatype: 'id', visible: true },
  { label: 'Product Name', property: 'productName', type: 'text', datatype: 'productName', visible: true },
  { label: 'Rating', property: 'rating', type: 'text', datatype: 'rating', visible: true },
  { label: 'User Name', property: 'userName', type: 'text', datatype: 'text', visible: true },
  { label: 'Approved', property: 'isApproved', type: 'text', datatype: 'status', visible: true },
  { label: 'Created On', property: 'createdAt', type: 'text', datatype: 'date', visible: true },
  { label: 'Actions', property: 'actions', type: 'button', datatype: 'button', visible: true },
];

export const ProductFaqComponentColumns: AdminTableColumnDefinition[] = [
  { label: 'ID', property: 'id', type: 'text', datatype: 'id', visible: true },
  { label: 'Question', property: 'question', type: 'text', datatype: 'question', visible: true },
  { label: 'Product Name', property: 'productName', type: 'text', datatype: 'productName', visible: true },
  { label: 'Status', property: 'isActive', type: 'text', datatype: 'status', visible: true },
  { label: 'Created On', property: 'createdAt', type: 'text', datatype: 'date', visible: true },
  { label: 'Actions', property: 'actions', type: 'button', datatype: 'button', visible: true },
];

export const ContactUsLeadsColumns: AdminTableColumnDefinition[] = [
  { label: 'ID', property: 'id', type: 'text', datatype: 'id', visible: true },
  { label: 'First Name', property: 'firstName', type: 'text', datatype: 'firstName', visible: true },
  { label: 'Last Name', property: 'lastName', type: 'text', datatype: 'lastName', visible: true },
  { label: 'Email', property: 'email', type: 'text', datatype: 'email', visible: true },
  { label: 'Phone Number', property: 'phoneNumber', type: 'text', datatype: 'phoneNumber', visible: true },
  { label: 'Status', property: 'status', type: 'text', datatype: 'contactLeadStatus', visible: true },
  { label: 'Created On', property: 'createdAt', type: 'text', datatype: 'date', visible: true },
  { label: 'Actions', property: 'actions', type: 'button', datatype: 'button', visible: true },
];

export const OrdersComponentColumns: AdminTableColumnDefinition[] = [
  { label: 'ID', property: 'id', type: 'text', datatype: 'id', visible: true },
  { label: 'Order #', property: 'orderNumber', type: 'text', datatype: 'text', visible: true },
  { label: 'Customer', property: 'customerName', type: 'text', datatype: 'name', visible: true },
  { label: 'Phone', property: 'phone', type: 'text', datatype: 'phoneNumber', visible: true },
  { label: 'Items', property: 'itemCount', type: 'text', datatype: 'text', visible: true },
  { label: 'Total', property: 'total', type: 'text', datatype: 'text', visible: true },
  { label: 'Payment', property: 'paymentMethod', type: 'text', datatype: 'text', visible: true },
  { label: 'Payment Status', property: 'paymentStatus', type: 'text', datatype: 'text', visible: true },
  { label: 'Order Status', property: 'orderStatus', type: 'text', datatype: 'text', visible: true },
  { label: 'Created On', property: 'createdAt', type: 'text', datatype: 'date', visible: true },
  { label: 'Actions', property: 'actions', type: 'button', datatype: 'button', visible: true },
];

export const RolesComponentColumns: AdminTableColumnDefinition[] = [
  { label: 'ID', property: 'id', type: 'text', datatype: 'id', visible: true },
  { label: 'Role Name', property: 'roleName', type: 'text', datatype: 'roleName', visible: true },
  { label: 'Role Id', property: 'roleId', type: 'text', datatype: 'roleId', visible: true },
  { label: 'Created On', property: 'createdAt', type: 'text', datatype: 'time', visible: true },
  { label: 'Updated On', property: 'updatedAt', type: 'text', datatype: 'time', visible: true },
  { label: 'Actions', property: 'actions', type: 'button', datatype: 'button', visible: true },
];

export const WebsiteLayoutColumns: AdminTableColumnDefinition[] = [
  { label: 'ID', property: 'id', type: 'text', datatype: 'id', visible: true },
  { label: 'Title', property: 'title', type: 'text', datatype: 'title', visible: true },
  { label: 'Type', property: 'type', type: 'text', datatype: 'type', visible: true },
  { label: 'Status', property: 'status', type: 'text', datatype: 'status', visible: true },
  { label: 'Position', property: 'position', type: 'text', datatype: 'text', visible: true },
  { label: 'Actions', property: 'actions', type: 'button', datatype: 'button', visible: true },
];
