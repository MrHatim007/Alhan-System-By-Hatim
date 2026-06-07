import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  getDocs, 
  onSnapshot, 
  addDoc, 
  deleteDoc,
  query, 
  orderBy,
  Firestore
} from 'firebase/firestore';
import { mockProducts, mockClients, mockExpenses, mockInvoices, mockCustodies, mockUsers } from './mockData';

// --- Type Definitions ---
export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'warehouse' | 'rep';
  createdAt: string;
  status: 'active' | 'suspended';
}

export interface ProductRecord {
  id: string;
  sku: string;
  nameEn: string;
  nameAr: string;
  category: 'Shisha' | 'Charcoal' | 'Accessories' | 'Other';
  costPrice: number;
  sellingPrice: number;
  warehouseStock: number;
  vanStock: number;
  minStockAlert: number;
  createdAt: string;
  archived?: boolean;
}

export interface ClientRecord {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  phone: string;
  address: string;
  creditLimit: number;
  outstandingDebt: number;
  createdAt: string;
  archived?: boolean;
}

export interface CustodyRecord {
  id: string;
  repId: string;
  repName: string;
  date: string;
  status: 'open' | 'closed';
  items: {
    productId: string;
    sku: string;
    nameEn: string;
    nameAr: string;
    qtyTransferred: number;
    qtyReturned: number;
    qtySold: number;
    qtyDiscrepancy: number;
  }[];
  cashCollected: number;
  cashReceived: number;
  closedAt?: string;
  closedBy?: string;
  notes?: string;
  archived?: boolean;
}

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  date: string;
  repId: string;
  repName: string;
  clientId: string;
  clientNameEn: string;
  clientNameAr: string;
  type: 'cash' | 'credit';
  items: {
    productId: string;
    nameEn: string;
    nameAr: string;
    quantity: number;
    unitPrice: number;
    costPrice: number;
    total: number;
  }[];
  totalAmount: number;
  paidAmount: number;
  debtAmount: number;
  status: 'paid' | 'unpaid' | 'partially_paid';
  custodyId?: string;
  gps?: { lat: number; lng: number } | null;
  archived?: boolean;
}

export interface ExpenseRecord {
  id: string;
  date: string;
  category: 'Fuel' | 'Vehicle Maintenance' | 'Warehouse Rent' | 'Salaries' | 'Other';
  description: string;
  amount: number;
  recordedBy: string;
}

// --- Firebase Initialization Helper ---
let firebaseApp: FirebaseApp | null = null;
let firestoreDb: Firestore | null = null;
let isFirebaseConnected = false;

export const checkFirebaseConfig = (): any | null => {
  const saved = localStorage.getItem('alhan_firebase_config');
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch (e) {
    console.error('Invalid Firebase configuration stored', e);
    return null;
  }
};

const initFirebase = () => {
  const config = checkFirebaseConfig();
  if (config) {
    try {
      if (getApps().length === 0) {
        firebaseApp = initializeApp(config);
      } else {
        firebaseApp = getApp();
      }
      firestoreDb = getFirestore(firebaseApp);
      isFirebaseConnected = true;
      console.log('Firebase initialized successfully.');
    } catch (e) {
      console.error('Failed to initialize Firebase', e);
      isFirebaseConnected = false;
      firestoreDb = null;
    }
  } else {
    isFirebaseConnected = false;
    firestoreDb = null;
  }
};

// Initialize on load
initFirebase();

export const isUsingFirebase = () => isFirebaseConnected;

// --- Local Storage Reactive Emulation (Pub-Sub) ---
type Callback<T> = (data: T) => void;
const subscribers: Record<string, Callback<any>[]> = {};

const triggerUpdate = (collectionName: string, data: any) => {
  if (subscribers[collectionName]) {
    subscribers[collectionName].forEach(cb => cb(data));
  }
};

// Seed LocalStorage helper
const getLocalCollection = <T>(key: string, initialData: T[]): T[] => {
  const data = localStorage.getItem(`alhan_mock_${key}`);
  if (!data) {
    localStorage.setItem(`alhan_mock_${key}`, JSON.stringify(initialData));
    return initialData;
  }
  try {
    return JSON.parse(data);
  } catch {
    return initialData;
  }
};

const saveLocalCollection = <T>(key: string, data: T[]) => {
  localStorage.setItem(`alhan_mock_${key}`, JSON.stringify(data));
  triggerUpdate(key, data);
};

// Seed the mock database into localStorage if empty
export const resetMockDatabase = () => {
  localStorage.setItem('alhan_mock_users', JSON.stringify(mockUsers));
  localStorage.setItem('alhan_mock_products', JSON.stringify(mockProducts));
  localStorage.setItem('alhan_mock_clients', JSON.stringify(mockClients));
  localStorage.setItem('alhan_mock_expenses', JSON.stringify(mockExpenses));
  localStorage.setItem('alhan_mock_invoices', JSON.stringify(mockInvoices));
  localStorage.setItem('alhan_mock_custodies', JSON.stringify(mockCustodies));
  
  // Trigger updates to active subscribers
  triggerUpdate('users', mockUsers);
  triggerUpdate('products', mockProducts);
  triggerUpdate('clients', mockClients);
  triggerUpdate('expenses', mockExpenses);
  triggerUpdate('invoices', mockInvoices);
  triggerUpdate('custodies', mockCustodies);
};

// Force clear old local mock database data if not yet migrated to v2 (empty state)
if (localStorage.getItem('alhan_mock_db_cleared_v2') !== 'true') {
  localStorage.removeItem('alhan_mock_users');
  localStorage.removeItem('alhan_mock_products');
  localStorage.removeItem('alhan_mock_clients');
  localStorage.removeItem('alhan_mock_expenses');
  localStorage.removeItem('alhan_mock_invoices');
  localStorage.removeItem('alhan_mock_custodies');
  localStorage.setItem('alhan_mock_db_cleared_v2', 'true');
}

// Ensure collections exist on launch
getLocalCollection('users', mockUsers);
getLocalCollection('products', mockProducts);
getLocalCollection('clients', mockClients);
getLocalCollection('expenses', mockExpenses);
getLocalCollection('invoices', mockInvoices);
getLocalCollection('custodies', mockCustodies);

// --- Swappable Database Services API ---

// 1. PRODUCTS
export const subscribeToProducts = (callback: Callback<ProductRecord[]>, includeArchived = false): (() => void) => {
  const filterActive = (list: ProductRecord[]) => includeArchived ? list : list.filter(p => !p.archived);
  if (isFirebaseConnected && firestoreDb) {
    const q = query(collection(firestoreDb, 'products'));
    return onSnapshot(q, (snapshot) => {
      const list: ProductRecord[] = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() } as ProductRecord);
      });
      callback(filterActive(list));
    }, (err) => {
      console.error('Firestore products subscription error', err);
      // Fallback
      const local = getLocalCollection<ProductRecord>('products', mockProducts);
      callback(filterActive(local));
    });
  } else {
    const key = 'products';
    if (!subscribers[key]) subscribers[key] = [];
    const wrappedCallback = (data: ProductRecord[]) => {
      callback(filterActive(data));
    };
    subscribers[key].push(wrappedCallback);
    
    // Initial call
    const local = getLocalCollection<ProductRecord>('products', mockProducts);
    callback(filterActive(local));
    
    return () => {
      subscribers[key] = subscribers[key].filter(cb => cb !== wrappedCallback);
    };
  }
};

export const archiveProduct = async (id: string) => {
  await updateProduct(id, { archived: true });
};

export const restoreProduct = async (id: string) => {
  await updateProduct(id, { archived: false });
};

export const deleteProduct = async (id: string) => {
  if (isFirebaseConnected && firestoreDb) {
    await deleteDoc(doc(firestoreDb, 'products', id));
  } else {
    const list = getLocalCollection<ProductRecord>('products', mockProducts);
    const updated = list.filter(p => p.id !== id);
    saveLocalCollection('products', updated);
  }
};

export const updateProduct = async (id: string, updates: Partial<ProductRecord>) => {
  if (isFirebaseConnected && firestoreDb) {
    const docRef = doc(firestoreDb, 'products', id);
    await updateDoc(docRef, updates);
  } else {
    const list = getLocalCollection<ProductRecord>('products', mockProducts);
    const updated = list.map(p => p.id === id ? { ...p, ...updates } : p);
    saveLocalCollection('products', updated);
  }
};

export const addProduct = async (product: Omit<ProductRecord, 'id' | 'createdAt'>) => {
  const newProduct: ProductRecord = {
    ...product,
    id: `prod-${Date.now()}`,
    createdAt: new Date().toISOString()
  };

  if (isFirebaseConnected && firestoreDb) {
    const docRef = doc(collection(firestoreDb, 'products'));
    await setDoc(docRef, { ...newProduct, id: docRef.id });
  } else {
    const list = getLocalCollection<ProductRecord>('products', mockProducts);
    list.push(newProduct);
    saveLocalCollection('products', list);
  }
};

// 2. CLIENTS
export const subscribeToClients = (callback: Callback<ClientRecord[]>, includeArchived = false): (() => void) => {
  const filterActive = (list: ClientRecord[]) => includeArchived ? list : list.filter(c => !c.archived);
  if (isFirebaseConnected && firestoreDb) {
    const q = query(collection(firestoreDb, 'clients'));
    return onSnapshot(q, (snapshot) => {
      const list: ClientRecord[] = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() } as ClientRecord);
      });
      callback(filterActive(list));
    }, (err) => {
      console.error('Firestore clients error', err);
      callback(filterActive(getLocalCollection<ClientRecord>('clients', mockClients)));
    });
  } else {
    const key = 'clients';
    if (!subscribers[key]) subscribers[key] = [];
    const wrappedCallback = (data: ClientRecord[]) => {
      callback(filterActive(data));
    };
    subscribers[key].push(wrappedCallback);
    
    const local = getLocalCollection<ClientRecord>('clients', mockClients);
    callback(filterActive(local));
    
    return () => {
      subscribers[key] = subscribers[key].filter(cb => cb !== wrappedCallback);
    };
  }
};

export const archiveClient = async (id: string) => {
  await updateClient(id, { archived: true });
};

export const restoreClient = async (id: string) => {
  await updateClient(id, { archived: false });
};

export const deleteClient = async (id: string) => {
  if (isFirebaseConnected && firestoreDb) {
    await deleteDoc(doc(firestoreDb, 'clients', id));
  } else {
    const list = getLocalCollection<ClientRecord>('clients', mockClients);
    const updated = list.filter(c => c.id !== id);
    saveLocalCollection('clients', updated);
  }
};

export const updateClient = async (id: string, updates: Partial<ClientRecord>) => {
  if (isFirebaseConnected && firestoreDb) {
    const docRef = doc(firestoreDb, 'clients', id);
    await updateDoc(docRef, updates);
  } else {
    const list = getLocalCollection<ClientRecord>('clients', mockClients);
    const updated = list.map(c => c.id === id ? { ...c, ...updates } : c);
    saveLocalCollection('clients', updated);
  }
};

export const addClient = async (client: Omit<ClientRecord, 'id' | 'createdAt' | 'code' | 'outstandingDebt'>) => {
  const list = getLocalCollection<ClientRecord>('clients', mockClients);
  const nextNum = 1000 + list.length + 1;
  
  const newClient: ClientRecord = {
    ...client,
    id: `cli-${Date.now()}`,
    code: `CLI-${nextNum}`,
    outstandingDebt: 0,
    createdAt: new Date().toISOString()
  };

  if (isFirebaseConnected && firestoreDb) {
    const docRef = doc(collection(firestoreDb, 'clients'));
    await setDoc(docRef, { ...newClient, id: docRef.id });
  } else {
    list.push(newClient);
    saveLocalCollection('clients', list);
  }
};

// 3. INVOICES
export const subscribeToInvoices = (callback: Callback<InvoiceRecord[]>, includeArchived = false): (() => void) => {
  const filterActive = (list: InvoiceRecord[]) => includeArchived ? list : list.filter(inv => !inv.archived);
  if (isFirebaseConnected && firestoreDb) {
    const q = query(collection(firestoreDb, 'invoices'), orderBy('date', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const list: InvoiceRecord[] = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() } as InvoiceRecord);
      });
      callback(filterActive(list));
    }, (err) => {
      console.error('Firestore invoices error', err);
      callback(filterActive(getLocalCollection<InvoiceRecord>('invoices', mockInvoices)));
    });
  } else {
    const key = 'invoices';
    if (!subscribers[key]) subscribers[key] = [];
    const wrappedCallback = (data: InvoiceRecord[]) => {
      callback(filterActive(data));
    };
    subscribers[key].push(wrappedCallback);
    
    // Sort local by date descending
    const local = getLocalCollection<InvoiceRecord>('invoices', mockInvoices)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    callback(filterActive(local));
    
    return () => {
      subscribers[key] = subscribers[key].filter(cb => cb !== wrappedCallback);
    };
  }
};

export const archiveInvoice = async (id: string) => {
  if (isFirebaseConnected && firestoreDb) {
    const docRef = doc(firestoreDb, 'invoices', id);
    await updateDoc(docRef, { archived: true });
  } else {
    const list = getLocalCollection<InvoiceRecord>('invoices', mockInvoices);
    const updated = list.map(inv => inv.id === id ? { ...inv, archived: true } : inv);
    saveLocalCollection('invoices', updated);
  }
};

export const restoreInvoice = async (id: string) => {
  if (isFirebaseConnected && firestoreDb) {
    const docRef = doc(firestoreDb, 'invoices', id);
    await updateDoc(docRef, { archived: false });
  } else {
    const list = getLocalCollection<InvoiceRecord>('invoices', mockInvoices);
    const updated = list.map(inv => inv.id === id ? { ...inv, archived: false } : inv);
    saveLocalCollection('invoices', updated);
  }
};

export const deleteInvoice = async (id: string) => {
  if (isFirebaseConnected && firestoreDb) {
    await deleteDoc(doc(firestoreDb, 'invoices', id));
  } else {
    const list = getLocalCollection<InvoiceRecord>('invoices', mockInvoices);
    const updated = list.filter(inv => inv.id !== id);
    saveLocalCollection('invoices', updated);
  }
};

export const addInvoice = async (invoice: Omit<InvoiceRecord, 'id' | 'invoiceNumber' | 'date'>) => {
  const list = getLocalCollection<InvoiceRecord>('invoices', mockInvoices);
  const dateStr = new Date().toISOString();
  const dateYear = new Date().getFullYear();
  const nextNum = String(list.length + 1).padStart(4, '0');
  
  const newInvoice: InvoiceRecord = {
    ...invoice,
    id: `inv-${Date.now()}`,
    invoiceNumber: `INV-${dateYear}-${nextNum}`,
    date: dateStr
  };

  // Adjust outstanding debt for Client if payment type is credit
  const clientDebtAdjustment = newInvoice.debtAmount;
  if (clientDebtAdjustment !== 0) {
    const clientList = getLocalCollection<ClientRecord>('clients', mockClients);
    const client = clientList.find(c => c.id === invoice.clientId);
    if (client) {
      await updateClient(client.id, { outstandingDebt: (client.outstandingDebt || 0) + clientDebtAdjustment });
    }
  }

  // Deduct stock levels:
  // - If salesperson is 'warehouse' (direct sale), deduct from warehouseStock
  // - If salesperson is a representative, deduct from the rep's active custody (vanStock)
  const isDirectSale = invoice.repId === 'warehouse';
  
  if (isDirectSale) {
    const productList = getLocalCollection<ProductRecord>('products', mockProducts);
    for (const item of invoice.items) {
      const prod = productList.find(p => p.id === item.productId);
      if (prod) {
        await updateProduct(prod.id, { warehouseStock: Math.max(0, prod.warehouseStock - item.quantity) });
      }
    }
  } else {
    // Van Sales: Deduct custody items
    const custodyList = getLocalCollection<CustodyRecord>('custodies', mockCustodies);
    const custody = custodyList.find(c => c.id === invoice.custodyId && c.status === 'open');
    if (custody) {
      const updatedCustodyItems = custody.items.map(cItem => {
        const matchingSaleItem = invoice.items.find(sItem => sItem.productId === cItem.productId);
        if (matchingSaleItem) {
          return {
            ...cItem,
            qtySold: cItem.qtySold + matchingSaleItem.quantity
          };
        }
        return cItem;
      });
      
      const newCashCollected = custody.cashCollected + (invoice.type === 'cash' ? invoice.paidAmount : invoice.paidAmount);
      await updateCustody(custody.id, { 
        items: updatedCustodyItems, 
        cashCollected: newCashCollected 
      });
      
      // Update global product vanStock count
      const productList = getLocalCollection<ProductRecord>('products', mockProducts);
      for (const item of invoice.items) {
        const prod = productList.find(p => p.id === item.productId);
        if (prod) {
          await updateProduct(prod.id, { vanStock: Math.max(0, prod.vanStock - item.quantity) });
        }
      }
    }
  }

  if (isFirebaseConnected && firestoreDb) {
    const docRef = doc(collection(firestoreDb, 'invoices'));
    await setDoc(docRef, { ...newInvoice, id: docRef.id });
  } else {
    list.push(newInvoice);
    saveLocalCollection('invoices', list);
  }
};

// 4. CUSTODIES
export const subscribeToCustodies = (callback: Callback<CustodyRecord[]>, includeArchived = false): (() => void) => {
  const filterActive = (list: CustodyRecord[]) => includeArchived ? list : list.filter(c => !c.archived);
  if (isFirebaseConnected && firestoreDb) {
    const q = query(collection(firestoreDb, 'custodies'), orderBy('date', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const list: CustodyRecord[] = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() } as CustodyRecord);
      });
      callback(filterActive(list));
    }, (err) => {
      console.error('Firestore custodies error', err);
      callback(filterActive(getLocalCollection<CustodyRecord>('custodies', mockCustodies)));
    });
  } else {
    const key = 'custodies';
    if (!subscribers[key]) subscribers[key] = [];
    const wrappedCallback = (data: CustodyRecord[]) => {
      callback(filterActive(data));
    };
    subscribers[key].push(wrappedCallback);
    
    const local = getLocalCollection<CustodyRecord>('custodies', mockCustodies);
    callback(filterActive(local));
    
    return () => {
      subscribers[key] = subscribers[key].filter(cb => cb !== wrappedCallback);
    };
  }
};

export const archiveCustody = async (id: string) => {
  await updateCustody(id, { archived: true });
};

export const restoreCustody = async (id: string) => {
  await updateCustody(id, { archived: false });
};

export const deleteCustody = async (id: string) => {
  if (isFirebaseConnected && firestoreDb) {
    await deleteDoc(doc(firestoreDb, 'custodies', id));
  } else {
    const list = getLocalCollection<CustodyRecord>('custodies', mockCustodies);
    const updated = list.filter(c => c.id !== id);
    saveLocalCollection('custodies', updated);
  }
};

export const updateCustody = async (id: string, updates: Partial<CustodyRecord>) => {
  if (isFirebaseConnected && firestoreDb) {
    const docRef = doc(firestoreDb, 'custodies', id);
    await updateDoc(docRef, updates);
  } else {
    const list = getLocalCollection<CustodyRecord>('custodies', mockCustodies);
    const updated = list.map(c => c.id === id ? { ...c, ...updates } : c);
    saveLocalCollection('custodies', updated);
  }
};

export const addCustody = async (custody: Omit<CustodyRecord, 'id' | 'date' | 'status' | 'cashCollected' | 'cashReceived'>) => {
  const newCustody: CustodyRecord = {
    ...custody,
    id: `cust-${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    status: 'open',
    cashCollected: 0,
    cashReceived: 0
  };

  // Adjust warehouse stocks: deduct quantityTransferred
  const productList = getLocalCollection<ProductRecord>('products', mockProducts);
  for (const item of custody.items) {
    const prod = productList.find(p => p.id === item.productId);
    if (prod) {
      await updateProduct(prod.id, {
        warehouseStock: Math.max(0, prod.warehouseStock - item.qtyTransferred),
        vanStock: prod.vanStock + item.qtyTransferred
      });
    }
  }

  if (isFirebaseConnected && firestoreDb) {
    const docRef = doc(collection(firestoreDb, 'custodies'));
    await setDoc(docRef, { ...newCustody, id: docRef.id });
  } else {
    const list = getLocalCollection<CustodyRecord>('custodies', mockCustodies);
    list.push(newCustody);
    saveLocalCollection('custodies', list);
  }
};

// 5. EXPENSES
export const subscribeToExpenses = (callback: Callback<ExpenseRecord[]>): (() => void) => {
  if (isFirebaseConnected && firestoreDb) {
    const q = query(collection(firestoreDb, 'expenses'), orderBy('date', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const list: ExpenseRecord[] = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() } as ExpenseRecord);
      });
      callback(list);
    }, (err) => {
      console.error('Firestore expenses error', err);
      callback(getLocalCollection<ExpenseRecord>('expenses', mockExpenses));
    });
  } else {
    const key = 'expenses';
    if (!subscribers[key]) subscribers[key] = [];
    subscribers[key].push(callback);
    
    const local = getLocalCollection<ExpenseRecord>('expenses', mockExpenses);
    callback(local);
    
    return () => {
      subscribers[key] = subscribers[key].filter(cb => cb !== callback);
    };
  }
};

export const addExpense = async (expense: Omit<ExpenseRecord, 'id' | 'date'>) => {
  const newExpense: ExpenseRecord = {
    ...expense,
    id: `exp-${Date.now()}`,
    date: new Date().toISOString()
  };

  if (isFirebaseConnected && firestoreDb) {
    const docRef = doc(collection(firestoreDb, 'expenses'));
    await setDoc(docRef, { ...newExpense, id: docRef.id });
  } else {
    const list = getLocalCollection<ExpenseRecord>('expenses', mockExpenses);
    list.push(newExpense);
    saveLocalCollection('expenses', list);
  }
};

export const deleteExpense = async (id: string) => {
  if (isFirebaseConnected && firestoreDb) {
    await deleteDoc(doc(firestoreDb, 'expenses', id));
  } else {
    const list = getLocalCollection<ExpenseRecord>('expenses', mockExpenses);
    const updated = list.filter(exp => exp.id !== id);
    saveLocalCollection('expenses', updated);
  }
};

// 6. USERS
export const subscribeToUsers = (callback: Callback<UserRecord[]>): (() => void) => {
  if (isFirebaseConnected && firestoreDb) {
    const q = query(collection(firestoreDb, 'users'));
    return onSnapshot(q, (snapshot) => {
      const list: UserRecord[] = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() } as UserRecord);
      });
      callback(list);
    }, (err) => {
      console.error('Firestore users error', err);
      callback(getLocalCollection<UserRecord>('users', mockUsers));
    });
  } else {
    const key = 'users';
    if (!subscribers[key]) subscribers[key] = [];
    subscribers[key].push(callback);
    
    const local = getLocalCollection<UserRecord>('users', mockUsers);
    callback(local);
    
    return () => {
      subscribers[key] = subscribers[key].filter(cb => cb !== callback);
    };
  }
};

export const addUser = async (user: Omit<UserRecord, 'id' | 'createdAt' | 'status'>) => {
  const newUser: UserRecord = {
    ...user,
    id: `usr-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: 'active'
  };

  if (isFirebaseConnected && firestoreDb) {
    const docRef = doc(collection(firestoreDb, 'users'));
    await setDoc(docRef, { ...newUser, id: docRef.id });
  } else {
    const list = getLocalCollection<UserRecord>('users', mockUsers);
    list.push(newUser);
    saveLocalCollection('users', list);
  }
};

export const updateUser = async (id: string, updates: Partial<UserRecord>) => {
  if (isFirebaseConnected && firestoreDb) {
    const docRef = doc(firestoreDb, 'users', id);
    await updateDoc(docRef, updates);
  } else {
    const list = getLocalCollection<UserRecord>('users', mockUsers);
    const updated = list.map(u => u.id === id ? { ...u, ...updates } : u);
    saveLocalCollection('users', updated);
  }
};

export const deleteUser = async (id: string) => {
  if (isFirebaseConnected && firestoreDb) {
    await deleteDoc(doc(firestoreDb, 'users', id));
  } else {
    const list = getLocalCollection<UserRecord>('users', mockUsers);
    const updated = list.filter(u => u.id !== id);
    saveLocalCollection('users', updated);
  }
};

// Seeding configuration options
export const saveFirebaseConfig = (config: any) => {
  localStorage.setItem('alhan_firebase_config', JSON.stringify(config));
  initFirebase();
  // Trigger general reload/refresh in application
  window.location.reload();
};

export const clearFirebaseConfig = () => {
  localStorage.removeItem('alhan_firebase_config');
  initFirebase();
  window.location.reload();
};
