import { ProductRecord, ClientRecord, UserRecord, InvoiceRecord, CustodyRecord, ExpenseRecord } from './dbService';

export const mockUsers: UserRecord[] = [
  {
    id: 'usr-admin',
    name: 'Hatim Al-Sharif',
    email: 'admin@alhan.com',
    role: 'admin',
    createdAt: '2026-05-01T10:00:00Z',
    status: 'active'
  },
  {
    id: 'usr-warehouse',
    name: 'Abu Fahad (Warehouse Manager)',
    email: 'warehouse@alhan.com',
    role: 'warehouse',
    createdAt: '2026-05-02T09:30:00Z',
    status: 'active'
  },
  {
    id: 'usr-rep-yazan',
    name: 'Yazan Mansour',
    email: 'rep1@alhan.com',
    role: 'rep',
    createdAt: '2026-05-03T08:00:00Z',
    status: 'active'
  },
  {
    id: 'usr-rep-samer',
    name: 'Samer Al-Masri',
    email: 'rep2@alhan.com',
    role: 'rep',
    createdAt: '2026-05-04T08:15:00Z',
    status: 'active'
  }
];

export const mockProducts: ProductRecord[] = [
  {
    id: 'prod-alf-01',
    sku: 'SHI-ALF-01',
    nameEn: 'Al-Fakher Two Apples 1kg',
    nameAr: 'معسل الفاخر تفاحتين 1 كيلو',
    category: 'Shisha',
    costPrice: 45,
    sellingPrice: 65,
    warehouseStock: 120,
    vanStock: 0,
    minStockAlert: 30,
    createdAt: '2026-05-01T10:00:00Z'
  },
  {
    id: 'prod-alf-02',
    sku: 'SHI-ALF-02',
    nameEn: 'Al-Fakher Mint 1kg',
    nameAr: 'معسل الفاخر نعناع 1 كيلو',
    category: 'Shisha',
    costPrice: 45,
    sellingPrice: 65,
    warehouseStock: 85,
    vanStock: 0,
    minStockAlert: 20,
    createdAt: '2026-05-01T10:10:00Z'
  },
  {
    id: 'prod-nak-01',
    sku: 'SHI-NAK-01',
    nameEn: 'Nakhla Double Apple 1kg',
    nameAr: 'معسل نخلة تفاحتين 1 كيلو',
    category: 'Shisha',
    costPrice: 50,
    sellingPrice: 70,
    warehouseStock: 80,
    vanStock: 0,
    minStockAlert: 20,
    createdAt: '2026-05-01T10:20:00Z'
  },
  {
    id: 'prod-ind-01',
    sku: 'COA-IND-01',
    nameEn: 'Indonesian Charcoal 10kg',
    nameAr: 'فحم إندونيسي طبيعي 10 كيلو',
    category: 'Charcoal',
    costPrice: 30,
    sellingPrice: 48,
    warehouseStock: 250,
    vanStock: 0,
    minStockAlert: 50,
    createdAt: '2026-05-01T10:30:00Z'
  },
  {
    id: 'prod-hex-01',
    sku: 'COA-HEX-01',
    nameEn: 'Hexagonal Charcoal 10kg',
    nameAr: 'فحم سداسي مضغوط 10 كيلو',
    category: 'Charcoal',
    costPrice: 25,
    sellingPrice: 38,
    warehouseStock: 180,
    vanStock: 0,
    minStockAlert: 40,
    createdAt: '2026-05-01T10:40:00Z'
  },
  {
    id: 'prod-foi-01',
    sku: 'ACC-FOI-01',
    nameEn: 'Shisha Foil Roll 100m',
    nameAr: 'رول قصدير شيشة 100 متر',
    category: 'Accessories',
    costPrice: 8,
    sellingPrice: 15,
    warehouseStock: 90,
    vanStock: 0,
    minStockAlert: 15,
    createdAt: '2026-05-01T10:50:00Z'
  },
  {
    id: 'prod-tng-01',
    sku: 'ACC-TNG-01',
    nameEn: 'Metal Charcoal Tongs',
    nameAr: 'ملقط فحم معدني',
    category: 'Accessories',
    costPrice: 2.5,
    sellingPrice: 6,
    warehouseStock: 150,
    vanStock: 0,
    minStockAlert: 25,
    createdAt: '2026-05-01T11:00:00Z'
  }
];

export const mockClients: ClientRecord[] = [
  {
    id: 'cli-001',
    code: 'CLI-1001',
    nameEn: 'Al-Firdous Cafe',
    nameAr: 'مقهى الفردوس',
    phone: '+971501234567',
    address: 'Deira, Dubai, UAE',
    creditLimit: 2500,
    outstandingDebt: 0,
    createdAt: '2026-05-05T12:00:00Z'
  },
  {
    id: 'cli-002',
    code: 'CLI-1002',
    nameEn: 'Sultan Shisha Lounge',
    nameAr: 'صالة السلطان للشيشة',
    phone: '+971559876543',
    address: 'Jumeirah 1, Dubai, UAE',
    creditLimit: 5000,
    outstandingDebt: 0,
    createdAt: '2026-05-06T14:30:00Z'
  },
  {
    id: 'cli-003',
    code: 'CLI-1003',
    nameEn: 'Al-Waha Cafe',
    nameAr: 'مقهى الواحة الشرقية',
    phone: '+971524455667',
    address: 'Al Majaz, Sharjah, UAE',
    creditLimit: 1500,
    outstandingDebt: 0,
    createdAt: '2026-05-07T11:00:00Z'
  },
  {
    id: 'cli-004',
    code: 'CLI-1004',
    nameEn: 'Breeze Beach Lounge',
    nameAr: 'لاونج نسيم البحر',
    phone: '+971587766554',
    address: 'Dubai Marina, UAE',
    creditLimit: 8000,
    outstandingDebt: 0,
    createdAt: '2026-05-08T16:00:00Z'
  },
  {
    id: 'cli-005',
    code: 'CLI-1005',
    nameEn: 'Layali Cafe',
    nameAr: 'مقهى ليالي زمان',
    phone: '+971508889990',
    address: 'Ajman Corniche, UAE',
    creditLimit: 2000,
    outstandingDebt: 0,
    createdAt: '2026-05-09T09:45:00Z'
  }
];

export const mockExpenses: ExpenseRecord[] = [];
export const mockInvoices: InvoiceRecord[] = [];
export const mockCustodies: CustodyRecord[] = [];
