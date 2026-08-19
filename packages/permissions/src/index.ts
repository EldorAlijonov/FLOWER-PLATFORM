export const permissions = {
  ordersRead: 'orders.read',
  ordersCreate: 'orders.create',
  ordersUpdateStatus: 'orders.update_status',
  productsManage: 'products.manage',
  employeesManage: 'employees.manage',
  reportsRead: 'reports.read',
} as const;

export type Permission = (typeof permissions)[keyof typeof permissions];
