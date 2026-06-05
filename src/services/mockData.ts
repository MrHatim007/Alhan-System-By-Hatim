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
    vanStock: 15,
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
    vanStock: 10,
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
    warehouseStock: 18, // Triggering low stock warning
    vanStock: 5,
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
    vanStock: 40,
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
    vanStock: 30,
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
    vanStock: 12,
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
    vanStock: 8,
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
    outstandingDebt: 1200,
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
    outstandingDebt: 3400,
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
    outstandingDebt: 6700, // Near limit
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
    outstandingDebt: 450,
    createdAt: '2026-05-09T09:45:00Z'
  }
];

export const mockExpenses: ExpenseRecord[] = [
  {
    id: 'exp-01',
    date: '2026-06-01T10:00:00Z',
    category: 'Fuel',
    description: 'Diesel fuel for delivery vans (Yazan & Samer)',
    amount: 150,
    recordedBy: 'Abu Fahad'
  },
  {
    id: 'exp-02',
    date: '2026-06-02T15:30:00Z',
    category: 'Vehicle Maintenance',
    description: 'Oil change and brake pads check for Rep 1 Van',
    amount: 320,
    recordedBy: 'Hatim Al-Sharif'
  },
  {
    id: 'exp-03',
    date: '2026-06-04T09:00:00Z',
    category: 'Warehouse Rent',
    description: 'Monthly electricity and cooling utility bills',
    amount: 850,
    recordedBy: 'Hatim Al-Sharif'
  },
  {
    id: 'exp-04',
    date: '2026-06-05T12:00:00Z',
    category: 'Other',
    description: 'Refreshments, tea, water bottles for warehouse staff',
    amount: 75,
    recordedBy: 'Abu Fahad'
  }
];

// Historical Invoices to build a beautiful P&L chart
export const mockInvoices: InvoiceRecord[] = [
  {
    id: 'inv-101',
    invoiceNumber: 'INV-2026-0001',
    date: '2026-06-02T11:20:00Z',
    repId: 'usr-rep-samer',
    repName: 'Samer Al-Masri',
    clientId: 'cli-001',
    clientNameEn: 'Al-Firdous Cafe',
    clientNameAr: 'مقهى الفردوس',
    type: 'credit',
    items: [
      {
        productId: 'prod-alf-01',
        nameEn: 'Al-Fakher Two Apples 1kg',
        nameAr: 'معسل الفاخر تفاحتين 1 كيلو',
        quantity: 5,
        unitPrice: 65,
        costPrice: 45,
        total: 325
      },
      {
        productId: 'prod-ind-01',
        nameEn: 'Indonesian Charcoal 10kg',
        nameAr: 'فحم إندونيسي طبيعي 10 كيلو',
        quantity: 10,
        unitPrice: 48,
        costPrice: 30,
        total: 480
      }
    ],
    totalAmount: 805,
    paidAmount: 200,
    debtAmount: 605,
    status: 'partially_paid',
    custodyId: 'cust-samer-yesterday'
  },
  {
    id: 'inv-102',
    invoiceNumber: 'INV-2026-0002',
    date: '2026-06-03T14:45:00Z',
    repId: 'usr-rep-yazan',
    repName: 'Yazan Mansour',
    clientId: 'cli-002',
    clientNameEn: 'Sultan Shisha Lounge',
    clientNameAr: 'صالة السلطان للشيشة',
    type: 'credit',
    items: [
      {
        productId: 'prod-alf-02',
        nameEn: 'Al-Fakher Mint 1kg',
        nameAr: 'معسل الفاخر نعناع 1 كيلو',
        quantity: 8,
        unitPrice: 65,
        costPrice: 45,
        total: 520
      },
      {
        productId: 'prod-hex-01',
        nameEn: 'Hexagonal Charcoal 10kg',
        nameAr: 'فحم سداسي مضغوط 10 كيلو',
        quantity: 15,
        unitPrice: 38,
        costPrice: 25,
        total: 570
      }
    ],
    totalAmount: 1090,
    paidAmount: 0,
    debtAmount: 1090,
    status: 'unpaid',
    custodyId: 'cust-yazan-prev'
  },
  {
    id: 'inv-103',
    invoiceNumber: 'INV-2026-0003',
    date: '2026-06-04T10:15:00Z',
    repId: 'warehouse',
    repName: 'Abu Fahad (Direct Sales)',
    clientId: 'cli-003',
    clientNameEn: 'Al-Waha Cafe',
    clientNameAr: 'مقهى الواحة الشرقية',
    type: 'cash',
    items: [
      {
        productId: 'prod-alf-01',
        nameEn: 'Al-Fakher Two Apples 1kg',
        nameAr: 'معسل الفاخر تفاحتين 1 كيلو',
        quantity: 10,
        unitPrice: 65,
        costPrice: 45,
        total: 650
      },
      {
        productId: 'prod-foi-01',
        nameEn: 'Shisha Foil Roll 100m',
        nameAr: 'رول قصدير شيشة 100 متر',
        quantity: 5,
        unitPrice: 15,
        costPrice: 8,
        total: 75
      }
    ],
    totalAmount: 725,
    paidAmount: 725,
    debtAmount: 0,
    status: 'paid'
  },
  {
    id: 'inv-104',
    invoiceNumber: 'INV-2026-0004',
    date: '2026-06-05T16:00:00Z',
    repId: 'usr-rep-yazan',
    repName: 'Yazan Mansour',
    clientId: 'cli-005',
    clientNameEn: 'Layali Cafe',
    clientNameAr: 'مقهى ليالي زمان',
    type: 'cash',
    items: [
      {
        productId: 'prod-ind-01',
        nameEn: 'Indonesian Charcoal 10kg',
        nameAr: 'فحم إندونيسي طبيعي 10 كيلو',
        quantity: 5,
        unitPrice: 48,
        costPrice: 30,
        total: 240
      },
      {
        productId: 'prod-tng-01',
        nameEn: 'Metal Charcoal Tongs',
        nameAr: 'ملقط فحم معدني',
        quantity: 2,
        unitPrice: 6,
        costPrice: 2.5,
        total: 12
      }
    ],
    totalAmount: 252,
    paidAmount: 252,
    debtAmount: 0,
    status: 'paid',
    custodyId: 'cust-yazan-active'
  }
];

// Custody (transfers / daily closing)
export const mockCustodies: CustodyRecord[] = [
  {
    id: 'cust-samer-yesterday',
    repId: 'usr-rep-samer',
    repName: 'Samer Al-Masri',
    date: '2026-06-04',
    status: 'closed',
    items: [
      {
        productId: 'prod-alf-01',
        sku: 'SHI-ALF-01',
        nameEn: 'Al-Fakher Two Apples 1kg',
        nameAr: 'معسل الفاخر تفاحتين 1 كيلو',
        qtyTransferred: 20,
        qtyReturned: 15,
        qtySold: 5,
        qtyDiscrepancy: 0
      },
      {
        productId: 'prod-ind-01',
        sku: 'COA-IND-01',
        nameEn: 'Indonesian Charcoal 10kg',
        nameAr: 'فحم إندونيسي طبيعي 10 كيلو',
        qtyTransferred: 30,
        qtyReturned: 20,
        qtySold: 10,
        qtyDiscrepancy: 0
      }
    ],
    cashCollected: 200,
    cashReceived: 200,
    closedAt: '2026-06-04T18:00:00Z',
    closedBy: 'usr-admin',
    notes: 'Perfect closing, all items accounted.'
  },
  {
    id: 'cust-yazan-active',
    repId: 'usr-rep-yazan',
    repName: 'Yazan Mansour',
    date: '2026-06-06',
    status: 'open',
    items: [
      {
        productId: 'prod-alf-01',
        sku: 'SHI-ALF-01',
        nameEn: 'Al-Fakher Two Apples 1kg',
        nameAr: 'معسل الفاخر تفاحتين 1 كيلو',
        qtyTransferred: 15,
        qtyReturned: 0,
        qtySold: 0,
        qtyDiscrepancy: 0
      },
      {
        productId: 'prod-alf-02',
        sku: 'SHI-ALF-02',
        nameEn: 'Al-Fakher Mint 1kg',
        nameAr: 'معسل الفاخر نعناع 1 كيلو',
        qtyTransferred: 10,
        qtyReturned: 0,
        qtySold: 0,
        qtyDiscrepancy: 0
      },
      {
        productId: 'prod-ind-01',
        sku: 'COA-IND-01',
        nameEn: 'Indonesian Charcoal 10kg',
        nameAr: 'فحم إندونيسي طبيعي 10 كيلو',
        qtyTransferred: 40,
        qtyReturned: 0,
        qtySold: 5, // from invoice inv-104
        qtyDiscrepancy: 0
      },
      {
        productId: 'prod-hex-01',
        sku: 'COA-HEX-01',
        nameEn: 'Hexagonal Charcoal 10kg',
        nameAr: 'فحم سداسي مضغوط 10 كيلو',
        qtyTransferred: 30,
        qtyReturned: 0,
        qtySold: 0,
        qtyDiscrepancy: 0
      },
      {
        productId: 'prod-foi-01',
        sku: 'ACC-FOI-01',
        nameEn: 'Shisha Foil Roll 100m',
        nameAr: 'رول قصدير شيشة 100 متر',
        qtyTransferred: 12,
        qtyReturned: 0,
        qtySold: 0,
        qtyDiscrepancy: 0
      },
      {
        productId: 'prod-tng-01',
        sku: 'ACC-TNG-01',
        nameEn: 'Metal Charcoal Tongs',
        nameAr: 'ملقط فحم معدني',
        qtyTransferred: 8,
        qtyReturned: 0,
        qtySold: 2, // from invoice inv-104
        qtyDiscrepancy: 0
      }
    ],
    cashCollected: 252,
    cashReceived: 0
  }
];
