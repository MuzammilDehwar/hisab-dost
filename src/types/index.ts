export type Language = 'ur' | 'ur-roman' | 'en';

export type PaymentType = 'cash' | 'credit' | 'online';

export type ExpenseCategory =
  | 'rent'
  | 'utilities'
  | 'transport'
  | 'salary'
  | 'packaging'
  | 'chai_refreshment'
  | 'maintenance'
  | 'other';

export interface SaleItem {
  productId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  unit?: string;
}

export interface Sale {
  id: string;
  date: string; // YYYY-MM-DD
  time?: string;
  amount: number;
  costAmount: number;
  paymentType: PaymentType;
  customerId?: string;
  customerName?: string;
  items?: SaleItem[];
  notes?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  time?: string;
  amount: number;
  category: ExpenseCategory;
  paymentMethod: 'cash' | 'online';
  notes?: string;
  createdAt: string;
}

export interface CustomerTransaction {
  id: string;
  customerId: string;
  type: 'gave_credit' | 'got_payment'; // gave_credit: customer took items on credit (+due); got_payment: customer paid money (-due)
  amount: number;
  date: string; // YYYY-MM-DD
  notes?: string;
  saleId?: string;
  balanceAfter: number;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  creditLimit?: number;
  balance: number; // positive = customer owes shopkeeper (udhaar); negative = advance
  lastTransactionDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  urduName?: string;
  barcode?: string;
  costPrice: number;
  salePrice: number;
  stockQuantity: number;
  minStockThreshold: number;
  unit: string; // 'عدد / Pcs', 'کلو / Kg', 'درجن / Dozen', 'پیکٹ / Pkt', 'لیٹر / Ltr'
  category?: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address?: string;
  balance: number; // positive = shop owes supplier
  createdAt: string;
  updatedAt: string;
}

export interface Purchase {
  id: string;
  supplierId?: string;
  supplierName: string;
  productId?: string;
  productName: string;
  quantity: number;
  unit: string;
  unitCost: number;
  total: number;
  paidAmount: number;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface ShopSettings {
  shopName: string;
  ownerName: string;
  phone: string;
  city: string;
  currencySymbol: string;
  language: Language;
  lastBackupDate?: string;
}

export interface AppState {
  sales: Sale[];
  expenses: Expense[];
  customers: Customer[];
  customerTransactions: CustomerTransaction[];
  products: Product[];
  suppliers: Supplier[];
  purchases: Purchase[];
  settings: ShopSettings;
}
