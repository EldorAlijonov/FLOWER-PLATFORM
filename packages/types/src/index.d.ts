export type ID = string;
export type Shop = {
    id: ID;
    name: string;
    status: 'ACTIVE' | 'BLOCKED';
    createdAt: string;
    updatedAt: string;
};
export type User = {
    id: ID;
    phone: string;
    fullName: string;
    status: 'ACTIVE' | 'BLOCKED';
};
export type Role = {
    id: ID;
    key: string;
    name: string;
};
export type Customer = {
    id: ID;
    shopId: ID;
    name: string;
};
export type Product = {
    id: ID;
    shopId: ID;
    name: string;
};
export type Order = {
    id: ID;
    shopId: ID;
    status: string;
};
export type Sale = {
    id: ID;
    shopId: ID;
    totalAmount: number;
};
export type CrmAdminMetric = {
    label: string;
    value: string;
    trend: string;
    tone: 'emerald' | 'sky' | 'amber' | 'rose';
};
export type CrmAdminOrder = {
    id: ID;
    customerName: string;
    bouquetName: string;
    status: 'NEW' | 'PREPARING' | 'READY' | 'DELIVERING';
    deliveryTime: string;
    totalAmount: number;
};
export type CrmAdminProduct = {
    id: ID;
    name: string;
    stock: number;
    price: number;
    status: 'ACTIVE' | 'LOW_STOCK' | 'PAUSED';
};
export type CrmAdminDashboard = {
    shop: Pick<Shop, 'id' | 'name' | 'status'>;
    metrics: CrmAdminMetric[];
    orders: CrmAdminOrder[];
    products: CrmAdminProduct[];
};
