import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/TranslationContext';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/GlassCard';
import { 
  subscribeToInvoices, 
  subscribeToClients, 
  subscribeToProducts, 
  addInvoice,
  InvoiceRecord,
  ClientRecord,
  ProductRecord
} from '../../services/dbService';
import { Search, Plus, Eye, Printer, FileText, CheckCircle, Clock } from 'lucide-react';

export const SalesInvoices: React.FC = () => {
  const { t, language } = useTranslation();
  const { user } = useAuth();
  
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [products, setProducts] = useState<ProductRecord[]>([]);

  // Search/Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('All');

  // Modals
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [showWalkInModal, setShowWalkInModal] = useState(false);

  // Walk-in form state
  const [selectedClientId, setSelectedClientId] = useState('');
  const [saleType, setSaleType] = useState<'cash' | 'credit'>('cash');
  const [cartItems, setCartItems] = useState<{ productId: string; quantity: number; unitPrice: number }[]>([]);
  const [paidAmount, setPaidAmount] = useState(0);

  // Cart addition form state
  const [currProductId, setCurrProductId] = useState('');
  const [currQty, setCurrQty] = useState(1);

  useEffect(() => {
    const unsubInvoices = subscribeToInvoices(setInvoices);
    const unsubClients = subscribeToClients(setClients);
    const unsubProducts = subscribeToProducts(setProducts);

    return () => {
      unsubInvoices();
      unsubClients();
      unsubProducts();
    };
  }, []);

  // Filtered invoices
  const filteredInvoices = invoices.filter(inv => {
    const matchSearch = 
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.clientNameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.clientNameAr.includes(searchTerm) ||
      inv.repName.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchType = paymentTypeFilter === 'All' || inv.type === paymentTypeFilter;

    return matchSearch && matchType;
  });

  const getClientDebtWarning = () => {
    if (!selectedClientId) return false;
    const client = clients.find(c => c.id === selectedClientId);
    if (!client) return false;
    return client.outstandingDebt >= client.creditLimit;
  };

  const getClientDetails = () => {
    return clients.find(c => c.id === selectedClientId);
  };

  // Direct sale cart helper
  const handleAddToCart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currProductId || currQty <= 0) return;

    const prod = products.find(p => p.id === currProductId);
    if (!prod) return;

    if (currQty > prod.warehouseStock) {
      alert(`Insufficient stock! Main warehouse only has ${prod.warehouseStock} available.`);
      return;
    }

    const existingIdx = cartItems.findIndex(ci => ci.productId === currProductId);
    if (existingIdx !== -1) {
      const updated = [...cartItems];
      if (updated[existingIdx].quantity + currQty > prod.warehouseStock) {
        alert(`Insufficient stock! Main warehouse only has ${prod.warehouseStock} available.`);
        return;
      }
      updated[existingIdx].quantity += currQty;
      setCartItems(updated);
    } else {
      setCartItems([...cartItems, {
        productId: prod.id,
        quantity: currQty,
        unitPrice: prod.sellingPrice
      }]);
    }

    setCurrProductId('');
    setCurrQty(1);
  };

  const handleRemoveFromCart = (index: number) => {
    setCartItems(cartItems.filter((_, i) => i !== index));
  };

  const getCartTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const handleCreateWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0 || !selectedClientId) return;

    const client = clients.find(c => c.id === selectedClientId);
    if (!client) return;

    const totalAmount = getCartTotal();
    const finalPaid = saleType === 'cash' ? totalAmount : Number(paidAmount);
    const finalDebt = Math.max(0, totalAmount - finalPaid);

    // Enforce strict credit limits
    if (saleType === 'credit' && (client.outstandingDebt + finalDebt > client.creditLimit)) {
      alert(`Credit sale denied! Client credit limit exceeded ($${client.creditLimit} limit, current debt $${client.outstandingDebt}, new invoice debt $${finalDebt}).`);
      return;
    }

    const itemsPayload = cartItems.map(item => {
      const prod = products.find(p => p.id === item.productId)!;
      return {
        productId: item.productId,
        nameEn: prod.nameEn,
        nameAr: prod.nameAr,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        costPrice: prod.costPrice,
        total: item.quantity * item.unitPrice
      };
    });

    const status = finalDebt === 0 ? 'paid' : finalPaid === 0 ? 'unpaid' : 'partially_paid';

    await addInvoice({
      repId: 'warehouse',
      repName: `Warehouse Direct (${user?.name || 'Manager'})`,
      clientId: selectedClientId,
      clientNameEn: client.nameEn,
      clientNameAr: client.nameAr,
      type: saleType,
      items: itemsPayload,
      totalAmount,
      paidAmount: finalPaid,
      debtAmount: finalDebt,
      status
    });

    // Reset Form
    setSelectedClientId('');
    setCartItems([]);
    setPaidAmount(0);
    setSaleType('cash');
    setShowWalkInModal(false);
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-wider mb-1">
            {t('menuInvoices')}
          </h2>
          <p className="text-text-secondary text-sm">
            Live feed of sales records, print receipts, log walk-in orders.
          </p>
        </div>
        <button
          onClick={() => setShowWalkInModal(true)}
          className="btn-primary-cyan flex items-center gap-2 text-sm py-2 px-4"
        >
          <Plus className="w-4 h-4" />
          {t('createWalkInInvoice')}
        </button>
      </div>

      {/* Filter Bar */}
      <GlassCard className="p-4 flex flex-col md:flex-row gap-4">
        
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search invoice number, client, salesperson..."
            className="pl-9 text-sm w-full"
          />
        </div>

        {/* Payment type selector */}
        <div className="w-full md:w-48">
          <select
            value={paymentTypeFilter}
            onChange={(e) => setPaymentTypeFilter(e.target.value)}
            className="text-sm w-full"
          >
            <option value="All">{t('all')}</option>
            <option value="cash">{t('cash')}</option>
            <option value="credit">{t('credit')}</option>
          </select>
        </div>

      </GlassCard>

      {/* Invoices List */}
      <GlassCard className="p-6">
        <div className="dense-table-container">
          <table className="dense-table">
            <thead>
              <tr>
                <th>{t('invoiceNum')}</th>
                <th>{t('date')}</th>
                <th>{t('client')}</th>
                <th>{t('salesperson')}</th>
                <th>{t('paymentType')}</th>
                <th>{t('total')}</th>
                <th>{t('paid')}</th>
                <th>{t('due')}</th>
                <th>{t('status')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center text-text-muted py-6">
                    {t('noData')}
                  </td>
                </tr>
              ) : (
                filteredInvoices.map(inv => (
                  <tr key={inv.id}>
                    <td className="font-mono text-neon-cyan font-semibold">{inv.invoiceNumber}</td>
                    <td className="text-xs text-text-secondary">
                      {new Date(inv.date).toLocaleString()}
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <span className="font-medium text-white">{inv.clientNameEn}</span>
                        <span className="text-xs text-text-secondary font-arabic" dir="rtl">{inv.clientNameAr}</span>
                      </div>
                    </td>
                    <td className="text-sm text-text-secondary">{inv.repName}</td>
                    <td>
                      <span className={`text-xs font-bold ${inv.type === 'cash' ? 'text-neon-green' : 'text-neon-pink'}`}>
                        {inv.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="font-semibold text-white font-mono">${inv.totalAmount}</td>
                    <td className="text-text-secondary font-mono">${inv.paidAmount}</td>
                    <td className="text-neon-pink font-mono">${inv.debtAmount}</td>
                    <td>
                      <span className={`badge ${
                        inv.status === 'paid' ? 'badge-paid' : inv.status === 'unpaid' ? 'badge-unpaid' : 'badge-partial'
                      }`}>
                        {t(`status${inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}`)}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="p-1.5 rounded hover:bg-white/5 text-slate-400 hover:text-white"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Invoice Detail Receipt Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <GlassCard glowColor="cyan" className="w-full max-w-lg p-6 bg-slate-950 border border-slate-800 text-white relative">
            
            {/* Header info */}
            <div className="text-center border-b border-slate-800 pb-4 mb-4">
              <h3 className="text-lg font-black tracking-wider text-neon-cyan uppercase">
                {t('receiptTitle')}
              </h3>
              <p className="text-xs text-text-secondary font-arabic">{t('shishaWholesale')}</p>
              <p className="text-[10px] text-text-muted">Dubai - UAE | +971 4 000 0000</p>
            </div>

            {/* Meta row */}
            <div className="grid grid-cols-2 gap-4 text-xs text-text-secondary mb-4">
              <div className="flex flex-col gap-1">
                <span>{t('invoiceNum')}: <strong className="text-white font-mono">{selectedInvoice.invoiceNumber}</strong></span>
                <span>{t('date')}: <strong className="text-white">{new Date(selectedInvoice.date).toLocaleString()}</strong></span>
              </div>
              <div className="flex flex-col gap-1 text-right">
                <span>{t('client')}: <strong className="text-white">{selectedInvoice.clientNameEn}</strong></span>
                <span>{t('salesperson')}: <strong className="text-white">{selectedInvoice.repName}</strong></span>
              </div>
            </div>

            {/* Items list */}
            <div className="border-b border-slate-800 pb-3 mb-3">
              <div className="flex text-xs font-bold text-text-secondary pb-2 border-b border-slate-900">
                <span className="flex-1">Product Description</span>
                <span className="w-16 text-center">Qty</span>
                <span className="w-20 text-right">Price</span>
                <span className="w-20 text-right">Total</span>
              </div>
              <div className="flex flex-col gap-2 pt-2 max-h-[160px] overflow-y-auto custom-scrollbar">
                {selectedInvoice.items.map((item, idx) => (
                  <div key={idx} className="flex text-xs items-center">
                    <div className="flex-1 flex flex-col">
                      <span className="font-semibold text-white">{item.nameEn}</span>
                      <span className="text-[10px] text-text-secondary font-arabic" dir="rtl">{item.nameAr}</span>
                    </div>
                    <span className="w-16 text-center text-white">{item.quantity}</span>
                    <span className="w-20 text-right text-text-secondary font-mono">${item.unitPrice}</span>
                    <span className="w-20 text-right text-white font-mono">${item.total}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="flex flex-col gap-1.5 text-xs text-text-secondary mb-6 align-end items-end w-full">
              <div className="flex justify-between w-48">
                <span>Total Amount:</span>
                <span className="text-white font-bold font-mono">${selectedInvoice.totalAmount}</span>
              </div>
              <div className="flex justify-between w-48 text-neon-green">
                <span>{t('paid')}:</span>
                <span className="font-bold font-mono">${selectedInvoice.paidAmount}</span>
              </div>
              <div className="flex justify-between w-48 text-neon-pink">
                <span>{t('due')}:</span>
                <span className="font-bold font-mono">${selectedInvoice.debtAmount}</span>
              </div>
              <div className="flex justify-between w-48 border-t border-slate-800 pt-2 font-bold text-white uppercase">
                <span>Type:</span>
                <span>{selectedInvoice.type}</span>
              </div>
            </div>

            <div className="flex gap-3 justify-between mt-4">
              <button
                onClick={() => window.print()}
                className="btn-secondary flex items-center gap-1.5 py-2 px-4 text-xs"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              
              <button
                onClick={() => setSelectedInvoice(null)}
                className="btn-primary-cyan py-2 px-6 text-xs"
              >
                {t('close')}
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Create Direct Walk-In Sale Modal */}
      {showWalkInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <GlassCard glowColor="cyan" className="w-full max-w-2xl p-6 bg-slate-950 border border-slate-800">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-neon-cyan" />
              {t('createWalkInInvoice')}
            </h3>

            <form onSubmit={handleCreateWalkIn} className="flex flex-col gap-4">
              
              {/* Client and payment selector */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-text-secondary font-bold uppercase">{t('client')}</label>
                  <select
                    value={selectedClientId}
                    onChange={(e) => {
                      setSelectedClientId(e.target.value);
                      setPaidAmount(0);
                    }}
                    required
                    className="text-sm"
                  >
                    <option value="">-- Choose Client --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nameEn} (Debt: ${c.outstandingDebt} / Limit: ${c.creditLimit})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-text-secondary font-bold uppercase">{t('paymentType')}</label>
                  <select
                    value={saleType}
                    onChange={(e) => {
                      setSaleType(e.target.value as any);
                      setPaidAmount(0);
                    }}
                    className="text-sm"
                  >
                    <option value="cash">{t('cash')}</option>
                    <option value="credit">{t('credit')}</option>
                  </select>
                </div>
              </div>

              {/* Credit Limit Warnings */}
              {getClientDebtWarning() && (
                <div className="p-3 rounded bg-neon-pink/15 border border-neon-pink/30 text-neon-pink text-xs flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{t('creditLimitExceededWarning')} Limit is: ${getClientDetails()?.creditLimit}</span>
                </div>
              )}

              {/* Add item to invoice cart */}
              <div className="border-t border-slate-800 pt-4 mt-2">
                <h4 className="text-xs font-bold text-neon-cyan uppercase mb-3">Add Products to Sale</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="flex flex-col gap-1.5 md:col-span-1">
                    <label className="text-xs text-text-secondary">Select Product</label>
                    <select
                      value={currProductId}
                      onChange={(e) => setCurrProductId(e.target.value)}
                      className="text-sm"
                    >
                      <option value="">-- Select Item --</option>
                      {products
                        .filter(p => p.warehouseStock > 0)
                        .map(p => (
                          <option key={p.id} value={p.id}>
                            {p.sku} - {p.nameEn} ({p.warehouseStock} in stock)
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-text-secondary">Quantity</label>
                    <input
                      type="number"
                      min={1}
                      value={currQty}
                      onChange={(e) => setCurrQty(Math.max(1, Number(e.target.value)))}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={!currProductId}
                    className="btn-primary-cyan py-3 text-xs"
                  >
                    Add to Invoice
                  </button>
                </div>
              </div>

              {/* Invoice cart table */}
              <div className="dense-table-container max-h-[160px] overflow-y-auto custom-scrollbar border border-slate-800 rounded mt-2">
                <table className="dense-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Total</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartItems.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center text-text-muted py-4">
                          Invoice cart is empty.
                        </td>
                      </tr>
                    ) : (
                      cartItems.map((item, idx) => {
                        const prod = products.find(p => p.id === item.productId)!;
                        return (
                          <tr key={item.productId}>
                            <td>{prod.nameEn}</td>
                            <td>{item.quantity}</td>
                            <td>${item.unitPrice}</td>
                            <td>${item.quantity * item.unitPrice}</td>
                            <td>
                              <button
                                type="button"
                                onClick={() => handleRemoveFromCart(idx)}
                                className="p-1 text-neon-pink hover:bg-neon-pink/10 rounded"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Credit pay amount field */}
              {saleType === 'credit' && cartItems.length > 0 && (
                <div className="flex flex-col gap-1.5 mt-2 max-w-xs">
                  <label className="text-xs text-text-secondary font-bold uppercase">Down Payment Amount ($)</label>
                  <input
                    type="number"
                    min={0}
                    max={getCartTotal()}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Math.max(0, Number(e.target.value)))}
                  />
                  <span className="text-[10px] text-text-secondary">
                    Outstanding debt will be: ${Math.max(0, getCartTotal() - paidAmount)}
                  </span>
                </div>
              )}

              {/* Invoice totals summary */}
              {cartItems.length > 0 && (
                <div className="flex justify-between items-center border-t border-slate-800 pt-4 mt-2">
                  <span className="text-sm text-text-secondary font-bold">
                    INVOICE TOTAL: <strong className="text-white text-base font-mono">${getCartTotal()}</strong>
                  </span>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedClientId('');
                        setCartItems([]);
                        setShowWalkInModal(false);
                      }}
                      className="btn-secondary py-2.5 px-4 text-xs"
                    >
                      {t('cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={!selectedClientId}
                      className="btn-primary-green py-2.5 px-6 text-xs font-bold"
                    >
                      Create Walk-In Sale
                    </button>
                  </div>
                </div>
              )}

            </form>
          </GlassCard>
        </div>
      )}

    </div>
  );
};
