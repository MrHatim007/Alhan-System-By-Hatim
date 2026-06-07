import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/TranslationContext';
import { GlassCard } from '../../components/GlassCard';
import { 
  subscribeToProducts, 
  restoreProduct, 
  deleteProduct,
  ProductRecord,
  subscribeToClients,
  restoreClient,
  deleteClient,
  ClientRecord,
  subscribeToInvoices,
  restoreInvoice,
  deleteInvoice,
  InvoiceRecord,
  subscribeToCustodies,
  restoreCustody,
  deleteCustody,
  CustodyRecord
} from '../../services/dbService';
import { 
  Archive, 
  RotateCcw, 
  Trash2, 
  Users, 
  Package, 
  FileText, 
  Truck, 
  Search, 
  Eye,
  X,
  Printer
} from 'lucide-react';

export const ArchiveView: React.FC = () => {
  const { t, language } = useTranslation();
  const [activeTab, setActiveTab] = useState<'clients' | 'products' | 'invoices' | 'custodies'>('clients');
  
  // Data States
  const [archivedClients, setArchivedClients] = useState<ClientRecord[]>([]);
  const [archivedProducts, setArchivedProducts] = useState<ProductRecord[]>([]);
  const [archivedInvoices, setArchivedInvoices] = useState<InvoiceRecord[]>([]);
  const [archivedCustodies, setArchivedCustodies] = useState<CustodyRecord[]>([]);

  // Search Terms
  const [clientSearch, setClientSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [custodySearch, setCustodySearch] = useState('');

  // Selected details preview modals
  const [previewInvoice, setPreviewInvoice] = useState<InvoiceRecord | null>(null);
  const [previewCustody, setPreviewCustody] = useState<CustodyRecord | null>(null);

  // Subscribe to ALL records, enabling archived: true filter explicitly
  useEffect(() => {
    const unsubClients = subscribeToClients(setArchivedClients, true);
    const unsubProducts = subscribeToProducts(setArchivedProducts, true);
    const unsubInvoices = subscribeToInvoices(setArchivedInvoices, true);
    const unsubCustodies = subscribeToCustodies(setArchivedCustodies, true);

    return () => {
      unsubClients();
      unsubProducts();
      unsubInvoices();
      unsubCustodies();
    };
  }, []);

  // Filter actual archived records only
  const archivedClientsOnly = archivedClients.filter(c => !!c.archived);
  const archivedProductsOnly = archivedProducts.filter(p => !!p.archived);
  const archivedInvoicesOnly = archivedInvoices.filter(inv => !!inv.archived);
  const archivedCustodiesOnly = archivedCustodies.filter(c => !!c.archived);

  // Search filters
  const filteredClients = archivedClientsOnly.filter(c => 
    c.nameEn.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.nameAr.includes(clientSearch) ||
    c.code.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const filteredProducts = archivedProductsOnly.filter(p => 
    p.nameEn.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.nameAr.includes(productSearch) ||
    p.sku.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredInvoices = archivedInvoicesOnly.filter(inv => 
    inv.invoiceNumber.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
    inv.clientNameEn.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
    inv.clientNameAr.includes(invoiceSearch) ||
    inv.repName.toLowerCase().includes(invoiceSearch.toLowerCase())
  );

  const filteredCustodies = archivedCustodiesOnly.filter(c => 
    c.repName.toLowerCase().includes(custodySearch.toLowerCase()) ||
    c.date.includes(custodySearch)
  );

  // Operations
  const handleRestoreClient = async (id: string) => {
    if (window.confirm(t('confirmArchive') + ' (Restore)')) {
      await restoreClient(id);
      alert(t('restoredSuccess'));
    }
  };

  const handleHardDeleteClient = async (id: string) => {
    if (window.confirm(t('confirmHardDelete'))) {
      await deleteClient(id);
      alert(t('deletedSuccess'));
    }
  };

  const handleRestoreProduct = async (id: string) => {
    if (window.confirm(t('confirmArchive') + ' (Restore)')) {
      await restoreProduct(id);
      alert(t('restoredSuccess'));
    }
  };

  const handleHardDeleteProduct = async (id: string) => {
    if (window.confirm(t('confirmHardDelete'))) {
      await deleteProduct(id);
      alert(t('deletedSuccess'));
    }
  };

  const handleRestoreInvoice = async (id: string) => {
    if (window.confirm(t('confirmArchive') + ' (Restore)')) {
      await restoreInvoice(id);
      alert(t('restoredSuccess'));
    }
  };

  const handleHardDeleteInvoice = async (id: string) => {
    if (window.confirm(t('confirmHardDelete'))) {
      await deleteInvoice(id);
      alert(t('deletedSuccess'));
    }
  };

  const handleRestoreCustody = async (id: string) => {
    if (window.confirm(t('confirmArchive') + ' (Restore)')) {
      await restoreCustody(id);
      alert(t('restoredSuccess'));
    }
  };

  const handleHardDeleteCustody = async (id: string) => {
    if (window.confirm(t('confirmHardDelete'))) {
      await deleteCustody(id);
      alert(t('deletedSuccess'));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
            <Archive className="w-5 h-5 text-neon-cyan flex-shrink-0" />
            {t('menuArchive')}
          </h2>
          <p className="text-text-secondary text-sm">
            {language === 'ar' 
              ? 'إدارة السجلات المؤرشفة والمنتهية. يمكنك استعادتها أو حذفها نهائياً.' 
              : 'Review and manage archived or completed records. Restore them to active lists or permanently delete them.'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-4 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('clients')}
          className={`py-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'clients' 
              ? 'border-neon-cyan text-neon-cyan text-glow-cyan' 
              : 'border-transparent text-text-secondary hover:text-white'
          }`}
        >
          <Users className="w-4 h-4 flex-shrink-0" />
          <span>{t('archivedClients')}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10 font-mono">
            {archivedClientsOnly.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`py-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'products' 
              ? 'border-neon-cyan text-neon-cyan text-glow-cyan' 
              : 'border-transparent text-text-secondary hover:text-white'
          }`}
        >
          <Package className="w-4 h-4 flex-shrink-0" />
          <span>{t('archivedProducts')}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10 font-mono">
            {archivedProductsOnly.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('invoices')}
          className={`py-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'invoices' 
              ? 'border-neon-cyan text-neon-cyan text-glow-cyan' 
              : 'border-transparent text-text-secondary hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4 flex-shrink-0" />
          <span>{t('archivedInvoices')}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10 font-mono">
            {archivedInvoicesOnly.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('custodies')}
          className={`py-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'custodies' 
              ? 'border-neon-cyan text-neon-cyan text-glow-cyan' 
              : 'border-transparent text-text-secondary hover:text-white'
          }`}
        >
          <Truck className="w-4 h-4 flex-shrink-0" />
          <span>{t('archivedCustodies')}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10 font-mono">
            {archivedCustodiesOnly.length}
          </span>
        </button>
      </div>

      {/* SEARCH AND TABLES */}

      {/* 1. Archived Clients */}
      {activeTab === 'clients' && (
        <div className="flex flex-col gap-4">
          <GlassCard className="p-4">
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-3 top-3 w-4 h-4 text-text-muted" />
              <input
                type="text"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                placeholder={t('search')}
                className="pl-9 text-sm w-full"
              />
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="dense-table-container">
              <table className="dense-table">
                <thead>
                  <tr>
                    <th>{t('clientCode')}</th>
                    <th>{t('clientName')}</th>
                    <th>{t('phone')}</th>
                    <th>{t('creditLimit')}</th>
                    <th>{t('outstandingDebt')}</th>
                    <th className="text-right">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-text-muted py-6">
                        {t('noData')}
                      </td>
                    </tr>
                  ) : (
                    filteredClients.map(c => (
                      <tr key={c.id}>
                        <td className="font-mono text-neon-cyan font-semibold">{c.code}</td>
                        <td>
                          <div className="flex flex-col">
                            <span className="font-medium text-white">{c.nameEn}</span>
                            <span className="text-xs text-text-secondary font-arabic" dir="rtl">{c.nameAr}</span>
                          </div>
                        </td>
                        <td className="text-text-secondary">{c.phone}</td>
                        <td className="font-mono">${c.creditLimit}</td>
                        <td className="font-mono text-neon-pink">${c.outstandingDebt}</td>
                        <td>
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => handleRestoreClient(c.id)}
                              title={t('restoreItem')}
                              className="btn-primary-green p-1 px-2.5 rounded text-xs font-bold flex items-center gap-1.5 min-h-[32px]"
                            >
                              <RotateCcw className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>{t('restoreItem')}</span>
                            </button>
                            <button
                              onClick={() => handleHardDeleteClient(c.id)}
                              title={t('hardDeleteItem')}
                              className="btn-primary-pink p-1 px-2.5 rounded text-xs font-bold flex items-center gap-1.5 min-h-[32px]"
                            >
                              <Trash2 className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>{t('hardDeleteItem')}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      )}

      {/* 2. Archived Products */}
      {activeTab === 'products' && (
        <div className="flex flex-col gap-4">
          <GlassCard className="p-4">
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-3 top-3 w-4 h-4 text-text-muted" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder={t('search')}
                className="pl-9 text-sm w-full"
              />
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="dense-table-container">
              <table className="dense-table">
                <thead>
                  <tr>
                    <th>{t('sku')}</th>
                    <th>{t('productName')}</th>
                    <th>{t('category')}</th>
                    <th>{t('costPrice')}</th>
                    <th>{t('sellingPrice')}</th>
                    <th className="text-right">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-text-muted py-6">
                        {t('noData')}
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map(p => (
                      <tr key={p.id}>
                        <td className="font-mono text-neon-cyan font-semibold">{p.sku}</td>
                        <td>
                          <div className="flex flex-col">
                            <span className="font-medium text-white">{p.nameEn}</span>
                            <span className="text-xs text-text-secondary font-arabic" dir="rtl">{p.nameAr}</span>
                          </div>
                        </td>
                        <td>{p.category}</td>
                        <td className="font-mono">${p.costPrice}</td>
                        <td className="font-mono text-neon-green">${p.sellingPrice}</td>
                        <td>
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => handleRestoreProduct(p.id)}
                              className="btn-primary-green p-1 px-2.5 rounded text-xs font-bold flex items-center gap-1.5 min-h-[32px]"
                            >
                              <RotateCcw className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>{t('restoreItem')}</span>
                            </button>
                            <button
                              onClick={() => handleHardDeleteProduct(p.id)}
                              className="btn-primary-pink p-1 px-2.5 rounded text-xs font-bold flex items-center gap-1.5 min-h-[32px]"
                            >
                              <Trash2 className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>{t('hardDeleteItem')}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      )}

      {/* 3. Archived Invoices */}
      {activeTab === 'invoices' && (
        <div className="flex flex-col gap-4">
          <GlassCard className="p-4">
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-3 top-3 w-4 h-4 text-text-muted" />
              <input
                type="text"
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
                placeholder={t('search')}
                className="pl-9 text-sm w-full"
              />
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="dense-table-container">
              <table className="dense-table">
                <thead>
                  <tr>
                    <th>{t('invoiceNum')}</th>
                    <th>{t('date')}</th>
                    <th>{t('client')}</th>
                    <th>{t('paymentType')}</th>
                    <th>{t('total')}</th>
                    <th>{t('status')}</th>
                    <th className="text-right">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center text-text-muted py-6">
                        {t('noData')}
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map(inv => (
                      <tr key={inv.id}>
                        <td className="font-mono text-neon-cyan font-semibold">{inv.invoiceNumber}</td>
                        <td className="text-xs text-text-secondary">{new Date(inv.date).toLocaleDateString()}</td>
                        <td>
                          <div className="flex flex-col">
                            <span className="font-medium text-white">{inv.clientNameEn}</span>
                            <span className="text-xs text-text-secondary font-arabic" dir="rtl">{inv.clientNameAr}</span>
                          </div>
                        </td>
                        <td className="font-bold text-xs uppercase text-text-secondary">{inv.type}</td>
                        <td className="font-mono font-bold">${inv.totalAmount}</td>
                        <td>
                          <span className={`badge ${inv.status === 'paid' ? 'badge-paid' : 'badge-unpaid'}`}>
                            {inv.status}
                          </span>
                        </td>
                        <td>
                          <div className="flex justify-end items-center gap-1.5">
                            <button
                              onClick={() => setPreviewInvoice(inv)}
                              title={t('itemDetails')}
                              className="p-1.5 rounded hover:bg-white/5 text-slate-400 hover:text-white flex items-center justify-center min-w-[32px] min-h-[32px]"
                            >
                              <Eye className="w-4 h-4 flex-shrink-0" />
                            </button>
                            <button
                              onClick={() => handleRestoreInvoice(inv.id)}
                              className="btn-primary-green p-1 px-2.5 rounded text-xs font-bold flex items-center gap-1.5 min-h-[32px]"
                            >
                              <RotateCcw className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>{t('restoreItem')}</span>
                            </button>
                            <button
                              onClick={() => handleHardDeleteInvoice(inv.id)}
                              className="btn-primary-pink p-1 px-2.5 rounded text-xs font-bold flex items-center gap-1.5 min-h-[32px]"
                            >
                              <Trash2 className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>{t('hardDeleteItem')}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      )}

      {/* 4. Archived Custodies */}
      {activeTab === 'custodies' && (
        <div className="flex flex-col gap-4">
          <GlassCard className="p-4">
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-3 top-3 w-4 h-4 text-text-muted" />
              <input
                type="text"
                value={custodySearch}
                onChange={(e) => setCustodySearch(e.target.value)}
                placeholder={t('search')}
                className="pl-9 text-sm w-full"
              />
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="dense-table-container">
              <table className="dense-table">
                <thead>
                  <tr>
                    <th>Representative</th>
                    <th>Date Closed</th>
                    <th>Cash Collected</th>
                    <th>Cash Received</th>
                    <th>Discrepancy Status</th>
                    <th className="text-right">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustodies.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-text-muted py-6">
                        {t('noData')}
                      </td>
                    </tr>
                  ) : (
                    filteredCustodies.map(c => {
                      const disc = (c.cashReceived || 0) - c.cashCollected;
                      return (
                        <tr key={c.id}>
                          <td className="font-semibold text-white">{c.repName}</td>
                          <td className="text-xs text-text-secondary">{c.closedAt ? new Date(c.closedAt).toLocaleDateString() : c.date}</td>
                          <td className="font-mono text-neon-green">${c.cashCollected}</td>
                          <td className="font-mono text-white">${c.cashReceived || 0}</td>
                          <td className={`font-mono font-bold ${disc < 0 ? 'text-neon-pink' : disc > 0 ? 'text-neon-green' : 'text-text-muted'}`}>
                            {disc === 0 ? 'Reconciled' : disc > 0 ? `+${disc}` : disc}
                          </td>
                          <td>
                            <div className="flex justify-end items-center gap-1.5">
                              <button
                                onClick={() => setPreviewCustody(c)}
                                title={t('itemDetails')}
                                className="p-1.5 rounded hover:bg-white/5 text-slate-400 hover:text-white flex items-center justify-center min-w-[32px] min-h-[32px]"
                              >
                                <Eye className="w-4 h-4 flex-shrink-0" />
                              </button>
                              <button
                                onClick={() => handleRestoreCustody(c.id)}
                                className="btn-primary-green p-1 px-2.5 rounded text-xs font-bold flex items-center gap-1.5 min-h-[32px]"
                              >
                                <RotateCcw className="w-3.5 h-3.5 flex-shrink-0" />
                                <span>{t('restoreItem')}</span>
                              </button>
                              <button
                                onClick={() => handleHardDeleteCustody(c.id)}
                                className="btn-primary-pink p-1 px-2.5 rounded text-xs font-bold flex items-center gap-1.5 min-h-[32px]"
                              >
                                <Trash2 className="w-3.5 h-3.5 flex-shrink-0" />
                                <span>{t('hardDeleteItem')}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      )}

      {/* PREVIEW MODALS */}

      {/* Invoice Details Preview */}
      {previewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <GlassCard glowColor="cyan" className="w-full max-w-lg p-6 bg-slate-950 border border-slate-800 text-white relative">
            <div className="text-center border-b border-slate-800 pb-4 mb-4">
              <h3 className="text-lg font-black tracking-wider text-neon-cyan uppercase">
                {t('receiptTitle')} ({language === 'ar' ? 'مؤرشف' : 'ARCHIVED'})
              </h3>
              <p className="text-xs text-text-secondary font-arabic">{t('shishaWholesale')}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs text-text-secondary mb-4">
              <div className="flex flex-col gap-1">
                <span>{t('invoiceNum')}: <strong className="text-white font-mono">{previewInvoice.invoiceNumber}</strong></span>
                <span>{t('date')}: <strong className="text-white">{new Date(previewInvoice.date).toLocaleString()}</strong></span>
              </div>
              <div className="flex flex-col gap-1 text-right">
                <span>{t('client')}: <strong className="text-white">{previewInvoice.clientNameEn}</strong></span>
                <span>{t('salesperson')}: <strong className="text-white">{previewInvoice.repName}</strong></span>
              </div>
            </div>

            <div className="border-b border-slate-800 pb-3 mb-3">
              <div className="flex text-xs font-bold text-text-secondary pb-2 border-b border-slate-900">
                <span className="flex-1">Product Description</span>
                <span className="w-16 text-center">Qty</span>
                <span className="w-20 text-right">Price</span>
                <span className="w-20 text-right">Total</span>
              </div>
              <div className="flex flex-col gap-2 pt-2 max-h-[160px] overflow-y-auto custom-scrollbar">
                {previewInvoice.items.map((item, idx) => (
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

            <div className="flex flex-col gap-1.5 text-xs text-text-secondary mb-6 align-end items-end w-full">
              <div className="flex justify-between w-48">
                <span>Total Amount:</span>
                <span className="text-white font-bold font-mono">${previewInvoice.totalAmount}</span>
              </div>
              <div className="flex justify-between w-48 text-neon-green">
                <span>{t('paid')}:</span>
                <span className="font-bold font-mono">${previewInvoice.paidAmount}</span>
              </div>
              <div className="flex justify-between w-48 text-neon-pink">
                <span>{t('due')}:</span>
                <span className="font-bold font-mono">${previewInvoice.debtAmount}</span>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-4">
              <button
                onClick={() => setPreviewInvoice(null)}
                className="btn-primary-cyan py-2 px-6 text-xs"
              >
                {t('close')}
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Custody Details Preview */}
      {previewCustody && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <GlassCard glowColor="amber" className="w-full max-w-2xl p-6 bg-slate-950 border border-slate-800 text-white relative">
            <div className="text-center border-b border-slate-800 pb-4 mb-4">
              <h3 className="text-lg font-black tracking-wider text-neon-amber uppercase">
                Custody Daily Close Details
              </h3>
              <p className="text-xs text-text-secondary">Representative: {previewCustody.repName} | Date: {previewCustody.date}</p>
            </div>

            <div className="dense-table-container max-h-[220px] overflow-y-auto custom-scrollbar border border-slate-800 rounded mb-4">
              <table className="dense-table text-xs">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th className="text-center">Sent</th>
                    <th className="text-center">Sold</th>
                    <th className="text-center">Returned</th>
                    <th className="text-right">Variance</th>
                  </tr>
                </thead>
                <tbody>
                  {previewCustody.items.map(item => (
                    <tr key={item.productId}>
                      <td>
                        <div className="flex flex-col">
                          <span className="font-semibold text-white">{item.nameEn}</span>
                          <span className="text-[10px] text-text-muted font-mono">{item.sku}</span>
                        </div>
                      </td>
                      <td className="text-center text-text-secondary">{item.qtyTransferred}</td>
                      <td className="text-center text-neon-green">{item.qtySold}</td>
                      <td className="text-center text-white font-bold">{item.qtyReturned}</td>
                      <td className={`text-right font-mono font-bold ${item.qtyDiscrepancy === 0 ? 'text-text-muted' : 'text-neon-pink'}`}>
                        {item.qtyDiscrepancy > 0 ? `-${item.qtyDiscrepancy} (Loss)` : item.qtyDiscrepancy < 0 ? `+${Math.abs(item.qtyDiscrepancy)}` : '0'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs text-text-secondary border-t border-slate-800 pt-4 mb-4">
              <div className="flex flex-col gap-1">
                <span>Reported Cash Sales: <strong className="text-neon-green font-mono">${previewCustody.cashCollected}</strong></span>
                <span>Physical Cash Handed Over: <strong className="text-white font-mono">${previewCustody.cashReceived || 0}</strong></span>
              </div>
              <div className="flex flex-col gap-1 text-right">
                <span>Reconciled By: <strong className="text-white">{previewCustody.closedBy || 'Admin'}</strong></span>
                <span>Date Resolved: <strong className="text-white">{previewCustody.closedAt ? new Date(previewCustody.closedAt).toLocaleString() : 'N/A'}</strong></span>
              </div>
            </div>

            {previewCustody.notes && (
              <div className="p-3 bg-white/5 border border-white/10 rounded text-xs text-text-secondary mb-4">
                <strong>Reconciliation Notes:</strong>
                <p className="mt-1 font-arabic" dir="rtl">{previewCustody.notes}</p>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setPreviewCustody(null)}
                className="btn-primary-cyan py-2 px-6 text-xs"
              >
                {t('close')}
              </button>
            </div>
          </GlassCard>
        </div>
      )}

    </div>
  );
};
