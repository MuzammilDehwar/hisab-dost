import { AppState, Customer, CustomerTransaction, Expense, Product, Sale, ShopSettings } from '../types';
import { getTodayDateString } from '../utils/formatters';

const STORAGE_KEY = 'hisabdost_app_state_v1';

export function getInitialDemoState(): AppState {
  const today = getTodayDateString();
  
  // Previous date calculation for realistic timeline
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().split('T')[0];

  const initialSettings: ShopSettings = {
    shopName: 'مدینہ کریانہ و جنرل اسٹور',
    ownerName: 'محمد عثمان',
    phone: '0300-1234567',
    city: 'لاہور، پاکستان',
    currencySymbol: '₨',
    language: 'ur',
    lastBackupDate: undefined,
  };

  const initialProducts: Product[] = [
    {
      id: 'prod-1',
      name: 'Super Basmati Rice (سپریم باسمتی چاول)',
      urduName: 'باسمتی چاول',
      costPrice: 320,
      salePrice: 370,
      stockQuantity: 40,
      minStockThreshold: 10,
      unit: 'کلو / Kg',
      category: 'اناج و دالیں',
      updatedAt: today,
    },
    {
      id: 'prod-2',
      name: 'Fine Sugar (باریک چینی)',
      urduName: 'چینی',
      costPrice: 140,
      salePrice: 155,
      stockQuantity: 50,
      minStockThreshold: 15,
      unit: 'کلو / Kg',
      category: 'بنیادی اشیاء',
      updatedAt: today,
    },
    {
      id: 'prod-3',
      name: 'Dal Chana Special (دال چنا)',
      urduName: 'دال چنا',
      costPrice: 240,
      salePrice: 280,
      stockQuantity: 25,
      minStockThreshold: 8,
      unit: 'کلو / Kg',
      category: 'اناج و دالیں',
      updatedAt: today,
    },
    {
      id: 'prod-4',
      name: 'Kisan Cooking Oil 1 Litre (کوکنگ آئل)',
      urduName: 'کوکنگ آئل',
      costPrice: 480,
      salePrice: 530,
      stockQuantity: 18,
      minStockThreshold: 5,
      unit: 'پیکٹ / Pkt',
      category: 'گھی و آئل',
      updatedAt: today,
    },
    {
      id: 'prod-5',
      name: 'Tapal Danedar Tea 430g (تپال دانے دار چائے)',
      urduName: 'چائے پتی',
      costPrice: 660,
      salePrice: 720,
      stockQuantity: 12,
      minStockThreshold: 4,
      unit: 'پیکٹ / Pkt',
      category: 'چائے و مصالحہ جات',
      updatedAt: today,
    },
    {
      id: 'prod-6',
      name: 'Lifebuoy Total Soap (لائف بوائے صابن)',
      urduName: 'لائف بوائے صابن',
      costPrice: 110,
      salePrice: 125,
      stockQuantity: 3, // Low stock trigger!
      minStockThreshold: 6,
      unit: 'دانہ / Pcs',
      category: 'صابن و کاسمیٹکس',
      updatedAt: today,
    },
    {
      id: 'prod-7',
      name: 'Olpers Milk 1L Pack (اولپرز دودھ)',
      urduName: 'اولپرز دودھ',
      costPrice: 265,
      salePrice: 290,
      stockQuantity: 14,
      minStockThreshold: 6,
      unit: 'ڈبہ / Pkt',
      category: 'ڈیری و دودھ',
      updatedAt: today,
    },
  ];

  const initialCustomers: Customer[] = [
    {
      id: 'cust-1',
      name: 'حاجی محمد رفیق',
      phone: '03001234567',
      address: 'گلی نمبر 4، مین بازار',
      creditLimit: 10000,
      balance: 4200,
      lastTransactionDate: today,
      createdAt: yStr,
      updatedAt: today,
    },
    {
      id: 'cust-2',
      name: 'چوہدری اکرم گجر',
      phone: '03219876543',
      address: 'ڈیرہ گجراں، فرید ٹاؤن',
      creditLimit: 15000,
      balance: 2850,
      lastTransactionDate: yesterday.toISOString().split('T')[0],
      createdAt: yStr,
      updatedAt: today,
    },
    {
      id: 'cust-3',
      name: 'زاہد ماسٹر درزی',
      phone: '03335551234',
      address: 'دکان نمبر 12، کمرشل مارکیٹ',
      creditLimit: 5000,
      balance: 1400,
      lastTransactionDate: today,
      createdAt: yStr,
      updatedAt: today,
    },
    {
      id: 'cust-4',
      name: 'باجی فاطمہ (گھریلو گاہک)',
      phone: '03124445566',
      address: 'مکان 24، نزد جامع مسجد',
      creditLimit: 5000,
      balance: 0,
      lastTransactionDate: yesterday.toISOString().split('T')[0],
      createdAt: yStr,
      updatedAt: today,
    },
  ];

  const initialCustomerTransactions: CustomerTransaction[] = [
    {
      id: 'ctx-1',
      customerId: 'cust-1',
      type: 'gave_credit',
      amount: 4200,
      date: today,
      notes: 'ماہانہ سودا سلف (چینی، چاول، دال، آئل)',
      balanceAfter: 4200,
      createdAt: today,
    },
    {
      id: 'ctx-2',
      customerId: 'cust-2',
      type: 'gave_credit',
      amount: 4850,
      date: yStr,
      notes: 'گھی اور پتی کا سامان',
      balanceAfter: 4850,
      createdAt: yStr,
    },
    {
      id: 'ctx-3',
      customerId: 'cust-2',
      type: 'got_payment',
      amount: 2000,
      date: today,
      notes: 'کیش وصولی بمقام دکان',
      balanceAfter: 2850,
      createdAt: today,
    },
    {
      id: 'ctx-4',
      customerId: 'cust-3',
      type: 'gave_credit',
      amount: 1400,
      date: today,
      notes: 'چائے، دودھ اور ڈٹرجنٹ پاؤڈر',
      balanceAfter: 1400,
      createdAt: today,
    },
  ];

  const initialSales: Sale[] = [
    {
      id: 'sale-1',
      date: today,
      time: '10:15',
      amount: 2450,
      costAmount: 2100,
      paymentType: 'cash',
      items: [
        { productId: 'prod-1', name: 'باسمتی چاول', quantity: 5, unitPrice: 370, costPrice: 320, unit: 'کلو' },
        { productId: 'prod-2', name: 'چینی', quantity: 4, unitPrice: 155, costPrice: 140, unit: 'کلو' },
      ],
      notes: 'صبح کی پہلی نقد فروخت',
      createdAt: today,
    },
    {
      id: 'sale-2',
      date: today,
      time: '11:40',
      amount: 1440,
      costAmount: 1320,
      paymentType: 'cash',
      items: [
        { productId: 'prod-5', name: 'تپال دانے دار چائے', quantity: 2, unitPrice: 720, costPrice: 660, unit: 'پیکٹ' },
      ],
      notes: 'نقد فروخت',
      createdAt: today,
    },
    {
      id: 'sale-3',
      date: today,
      time: '14:20',
      amount: 4200,
      costAmount: 3700,
      paymentType: 'credit',
      customerId: 'cust-1',
      customerName: 'حاجی محمد رفیق',
      notes: 'کھاتے میں شامل کیا گیا (سودا سلف)',
      createdAt: today,
    },
    {
      id: 'sale-4',
      date: yStr,
      time: '18:10',
      amount: 8600,
      costAmount: 7600,
      paymentType: 'cash',
      notes: 'گزشتہ شام کی کل فروخت',
      createdAt: yStr,
    },
  ];

  const initialExpenses: Expense[] = [
    {
      id: 'exp-1',
      date: today,
      time: '11:00',
      amount: 350,
      category: 'chai_refreshment',
      paymentMethod: 'cash',
      notes: 'مہمانوں اور دکان عملے کی چائے بسکٹ',
      createdAt: today,
    },
    {
      id: 'exp-2',
      date: today,
      time: '13:00',
      amount: 600,
      category: 'packaging',
      paymentMethod: 'cash',
      notes: 'شاپر اور لفافے',
      createdAt: today,
    },
    {
      id: 'exp-3',
      date: yStr,
      time: '16:00',
      amount: 2500,
      category: 'transport',
      paymentMethod: 'cash',
      notes: 'غلہ منڈی سے سامان منگوانے کا رکشہ کرایہ',
      createdAt: yStr,
    },
  ];

  return {
    sales: initialSales,
    expenses: initialExpenses,
    customers: initialCustomers,
    customerTransactions: initialCustomerTransactions,
    products: initialProducts,
    settings: initialSettings,
  };
}

export function loadAppState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const demo = getInitialDemoState();
      saveAppState(demo);
      return demo;
    }
    const parsed = JSON.parse(raw) as Partial<AppState>;
    const defaultDemo = getInitialDemoState();

    return {
      sales: Array.isArray(parsed.sales) ? parsed.sales : [],
      expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
      customers: Array.isArray(parsed.customers) ? parsed.customers : [],
      customerTransactions: Array.isArray(parsed.customerTransactions) ? parsed.customerTransactions : [],
      products: Array.isArray(parsed.products) ? parsed.products : [],
      settings: parsed.settings ? { ...defaultDemo.settings, ...parsed.settings } : defaultDemo.settings,
    };
  } catch (err) {
    console.error('Error loading app state from localStorage:', err);
    return getInitialDemoState();
  }
}

export function saveAppState(state: AppState): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (err) {
    console.error('Error saving app state to localStorage:', err);
    return false;
  }
}

export function exportBackupJSON(state: AppState): AppState {
  const dateStr = getTodayDateString();
  const updatedState: AppState = {
    ...state,
    settings: {
      ...state.settings,
      lastBackupDate: new Date().toISOString(),
    },
  };
  // Save updated backup timestamp locally
  saveAppState(updatedState);

  const filename = `HisabDost-Backup-${dateStr}.json`;
  const blob = new Blob([JSON.stringify(updatedState, null, 2)], {
    type: 'application/json;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return updatedState;
}

export function importBackupJSON(file: File): Promise<AppState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text) as Partial<AppState>;
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Invalid JSON format.');
        }

        const defaultDemo = getInitialDemoState();
        const sanitized: AppState = {
          sales: Array.isArray(parsed.sales) ? parsed.sales : [],
          expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
          customers: Array.isArray(parsed.customers) ? parsed.customers : [],
          customerTransactions: Array.isArray(parsed.customerTransactions)
            ? parsed.customerTransactions
            : [],
          products: Array.isArray(parsed.products) ? parsed.products : [],
          settings: {
            ...defaultDemo.settings,
            ...(parsed.settings || {}),
            lastBackupDate: new Date().toISOString(),
          },
        };

        saveAppState(sanitized);
        resolve(sanitized);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read the backup file.'));
    reader.readAsText(file);
  });
}

