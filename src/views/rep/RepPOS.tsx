import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/TranslationContext';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/GlassCard';
import { QRScanner } from '../../components/QRScanner';
import { 
  subscribeToClients, 
  subscribeToCustodies, 
  addInvoice,
  ClientRecord,
  CustodyRecord
} from '../../services/dbService';
import { ShoppingCart, Camera, AlertTriangle, Plus, Trash2, Printer, ChevronRight } from 'lucide-react';

export const RepPOS: React.FC = () => {
  const { t, language } = useTranslation();
  const { user } = useAuth();

  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [custodies, setCustodies] = useState<CustodyRecord[]>([]);

  // Selection states
  const [selectedClientId, setSelectedClientId] = useState('');
  const [saleType, setSaleType] = useState<'cash' | 'credit'>('cash');
  const [cartItems, setCartItems] = useState<{ productId: string; quantity: number }[]>([]);
  const [paidAmount, setPaidAmount] = useState(0);

  // Scanner state
  const [showScanner, setShowScanner] = useState(false);
  const [scanMode, setScanMode] = useState<'clients' | 'products'>('clients');

  // Selector additions
  const [currProductId, setCurrProductId] = useState('');
  const [currQty, setCurrQty] = useState(1);

  // Receipt printable state
  const [completedInvoice, setCompletedInvoice] = useState<any | null>(null);

  useEffect(() => {
    const unsubClients = subscribeToClients(setClients);
    const unsubCust = subscribeToCustodies(setCustodies);

    return () => {
      unsubClients();
      unsubCust();
    };
  }, []);

  const activeCustody = custodies.find(c => c.repId === user?.id && c.status === 'open');
  const selectedClient = clients.find(c => c.id === selectedClientId);

  const handleScanSuccess = (decodedText: string) => {
    setShowScanner(false);
    
    if (scanMode === 'clients') {
      // Find matching client by code (e.g. CLI-1002)
      const matched = clients.find(c => c.code.toUpperCase() === decodedText.toUpperCase());
      if (matched) {
        setSelectedClientId(matched.id);
        alert(`${t('barcodeFound')} ${t('clientScanned')} ${language === 'ar' ? matched.nameAr : matched.nameEn}`);
      } else {
        alert(t('scannedCodeNoClient'));
      }
    } else {
      // Find matching product by SKU in van custody
      if (!activeCustody) return;
      const matchedItem = activeCustody.items.find(item => item.sku.toUpperCase() === decodedText.toUpperCase());
      if (matchedItem) {
        setCurrProductId(matchedItem.productId);
        alert(`${t('barcodeFound')} ${t('productScanned')} ${language === 'ar' ? matchedItem.nameAr : matchedItem.nameEn}`);
      } else {
        alert(t('scannedCodeNoItem'));
      }
    }
  };

  const handleAddToCart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustody || !currProductId || currQty <= 0) return;

    const custodyItem = activeCustody.items.find(item => item.productId === currProductId);
    if (!custodyItem) return;

    const remainingVanStock = custodyItem.qtyTransferred - custodyItem.qtySold - custodyItem.qtyReturned;
    
    // Check if adding exceeds remaining van stock
    const existingIndex = cartItems.findIndex(item => item.productId === currProductId);
    const cartQty = existingIndex !== -1 ? cartItems[existingIndex].quantity : 0;

    if (cartQty + currQty > remainingVanStock) {
      alert(`${t('insufficientVanStock')} ${t('maxRemainingIs')} ${remainingVanStock}`);
      return;
    }

    if (existingIndex !== -1) {
      const updated = [...cartItems];
      updated[existingIndex].quantity += currQty;
      setCartItems(updated);
    } else {
      setCartItems([...cartItems, {
        productId: currProductId,
        quantity: currQty
      }]);
    }

    setCurrProductId('');
    setCurrQty(1);
  };

  const handleRemoveFromCart = (index: number) => {
    setCartItems(cartItems.filter((_, i) => i !== index));
  };

  const getCartTotal = () => {
    if (!activeCustody) return 0;
    return cartItems.reduce((sum, item) => {
      // Find selling price
      const custItem = activeCustody.items.find(ci => ci.productId === item.productId)!;
      // estimate price based on SKU for simple totals
      const price = custItem.sku.startsWith('SHI') ? 65 : custItem.sku.startsWith('COA') ? 43 : 10;
      return sum + (item.quantity * price);
    }, 0);
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustody || !selectedClientId || !selectedClient || cartItems.length === 0) return;

    const totalAmount = getCartTotal();
    const finalPaid = saleType === 'cash' ? totalAmount : Number(paidAmount);
    const finalDebt = Math.max(0, totalAmount - finalPaid);

    // Validate Credit Limit
    if (saleType === 'credit' && (selectedClient.outstandingDebt + finalDebt > selectedClient.creditLimit)) {
      alert(t('creditLimitExceededError'));
      return;
    }

    try {
      const itemsPayload = cartItems.map(cItem => {
        const custodyItem = activeCustody.items.find(ci => ci.productId === cItem.productId)!;
        const price = custodyItem.sku.startsWith('SHI') ? 65 : custodyItem.sku.startsWith('COA') ? 43 : 10;
        
        // cost estimate for P&L tracking
        const costPrice = custodyItem.sku.startsWith('SHI') ? 45 : custodyItem.sku.startsWith('COA') ? 28 : 5;

        return {
          productId: cItem.productId,
          nameEn: custodyItem.nameEn,
          nameAr: custodyItem.nameAr,
          quantity: cItem.quantity,
          unitPrice: price,
          costPrice,
          total: cItem.quantity * price
        };
      });

      const status: 'paid' | 'unpaid' | 'partially_paid' = finalDebt === 0 ? 'paid' : finalPaid === 0 ? 'unpaid' : 'partially_paid';

      const invoiceData = {
        repId: user?.id || 'rep',
        repName: user?.name || 'Mandoob',
        clientId: selectedClientId,
        clientNameEn: selectedClient.nameEn,
        clientNameAr: selectedClient.nameAr,
        type: saleType,
        items: itemsPayload,
        totalAmount,
        paidAmount: finalPaid,
        debtAmount: finalDebt,
        status,
        custodyId: activeCustody.id
      };

      await addInvoice(invoiceData);

      // Trigger success receipt screen
      setCompletedInvoice({
        ...invoiceData,
        invoiceNumber: `INV-${new Date().getFullYear()}-MOCK`
      });

      // Clear cart
      setSelectedClientId('');
      setCartItems([]);
      setPaidAmount(0);
      setSaleType('cash');
    } catch (err) {
      alert(t('errorCreatingInvoice'));
    }
  };

  if (completedInvoice) {
    return (
      <div className="flex flex-col gap-6 pb-8 items-center">
        <GlassCard glowColor="green" className="w-full max-w-sm p-6 bg-slate-950 border border-slate-800 text-white text-center">
          <div className="mb-4">
            <span className="badge badge-paid px-4 py-1.5 font-bold animate-bounce mb-3">{t('invoiceCreatedSuccess')}</span>
            <h3 className="text-lg font-bold uppercase tracking-wider text-neon-green">
              {t('receiptTitle')}
            </h3>
            <p className="text-xs text-text-secondary">{language === 'ar' ? completedInvoice.clientNameAr : completedInvoice.clientNameEn}</p>
          </div>

          <div className={`border-y border-slate-900 py-3 my-4 text-xs text-text-secondary flex flex-col gap-1 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
            <div>{t('invoiceAmount')}: <strong className="text-white font-mono">${completedInvoice.totalAmount}</strong></div>
            <div>{t('cashReceived')}: <strong className="text-neon-green font-mono">${completedInvoice.paidAmount}</strong></div>
            <div>{t('remainingDebt')}: <strong className="text-neon-pink font-mono">${completedInvoice.debtAmount}</strong></div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => window.print()}
              className="btn-secondary flex-1 flex items-center justify-center gap-1 py-2 text-xs"
            >
              <Printer className="w-4 h-4" />
              {t('printReceipt')}
            </button>
            <button
              onClick={() => setCompletedInvoice(null)}
              className="btn-primary-cyan flex-1 py-2 text-xs font-bold"
            >
              {t('backToPOS')}
            </button>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 pb-12">
      
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold text-white uppercase tracking-wider">
            {t('fastPOS')}
          </h2>
        </div>
        
        {/* Scanner Trigger */}
        <button
          onClick={() => {
            setScanMode('clients');
            setShowScanner(true);
          }}
          className="btn-primary-cyan flex items-center gap-1.5 py-1.5 px-3 text-xs"
        >
          <Camera className="w-4 h-4" />
          {t('scanQR')}
        </button>
      </div>

      {/* Select Customer */}
      <GlassCard className="p-4 flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-secondary font-bold uppercase">{t('client')}</label>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="text-sm"
          >
            <option value="">{t('chooseCafe')}</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>
                {language === 'ar' ? c.nameAr : c.nameEn} ({t('debtLabel')}: ${c.outstandingDebt} / {t('limitLabel')}: ${c.creditLimit})
              </option>
            ))}
          </select>
        </div>

        {selectedClient && (
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs flex flex-col gap-1 text-text-secondary">
            <div className="flex justify-between">
              <span>{t('outstandingDebtLabel')}</span>
              <strong className="text-neon-pink font-mono">${selectedClient.outstandingDebt}</strong>
            </div>
            <div className="flex justify-between">
              <span>{t('creditLimitCapacityLabel')}</span>
              <strong className="text-white font-mono">${selectedClient.creditLimit}</strong>
            </div>
            <div className="flex justify-between border-t border-slate-850 pt-1.5 mt-1">
              <span>{t('availableCreditRoomLabel')}</span>
              <strong className="text-neon-cyan font-mono">${Math.max(0, selectedClient.creditLimit - selectedClient.outstandingDebt)}</strong>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Cart Items Selector */}
      {selectedClientId && activeCustody && (
        <GlassCard className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-neon-cyan uppercase">{t('addProductsFromVan')}</h4>
            <button
              type="button"
              onClick={() => {
                setScanMode('products');
                setShowScanner(true);
              }}
              className="p-1 rounded bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white flex items-center gap-1 text-[10px]"
            >
              <Camera className="w-3.5 h-3.5" />
              {t('scanBarcode')}
            </button>
          </div>

          <form onSubmit={handleAddToCart} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-text-secondary uppercase">{t('selectProduct')}</label>
              <select
                value={currProductId}
                onChange={(e) => setCurrProductId(e.target.value)}
                className="text-sm"
              >
                <option value="">{t('chooseItem')}</option>
                {activeCustody.items.map(item => {
                  const remaining = item.qtyTransferred - item.qtySold - item.qtyReturned;
                  return (
                    <option key={item.productId} value={item.productId} disabled={remaining <= 0}>
                      {item.sku} - {language === 'ar' ? item.nameAr : item.nameEn} ({remaining} {t('inVan')})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-text-secondary uppercase">{t('qtyToSell')}</label>
                <input
                  type="number"
                  min={1}
                  value={currQty}
                  onChange={(e) => setCurrQty(Math.max(1, Number(e.target.value)))}
                />
              </div>
              <button
                type="submit"
                disabled={!currProductId}
                className="btn-primary-cyan py-3 text-xs"
              >
                {t('addToCart')}
              </button>
            </div>
          </form>
        </GlassCard>
      )}

      {/* POS Cart items table */}
      {cartItems.length > 0 && activeCustody && (
        <GlassCard glowColor="cyan" className="p-4 flex flex-col gap-3">
          <h4 className="text-xs font-bold text-white uppercase">{t('invoiceCart')}</h4>
          
          <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto custom-scrollbar">
            {cartItems.map((item, idx) => {
              const custodyItem = activeCustody.items.find(ci => ci.productId === item.productId)!;
              const price = custodyItem.sku.startsWith('SHI') ? 65 : custodyItem.sku.startsWith('COA') ? 43 : 10;
              return (
                <div key={item.productId} className="flex justify-between items-center py-2 border-b border-slate-900 text-xs">
                  <div className="flex flex-col">
                    <span className="font-semibold text-white">{language === 'ar' ? custodyItem.nameAr : custodyItem.nameEn}</span>
                    <span className="text-[10px] text-text-secondary">{t('qtyCartLabel')}: {item.quantity} x ${price}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold font-mono text-white">${item.quantity * price}</span>
                    <button
                      onClick={() => handleRemoveFromCart(idx)}
                      className="text-neon-pink hover:bg-neon-pink/10 p-1 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center border-t border-slate-900 pt-3">
            <span className="text-xs text-text-secondary uppercase">{t('invoiceTotal')}</span>
            <strong className="text-lg font-black text-white font-mono">${getCartTotal()}</strong>
          </div>

          {/* Payment parameters form */}
          <form onSubmit={handleCheckout} className="flex flex-col gap-3 border-t border-slate-900 pt-3 mt-1">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-text-secondary uppercase">{t('paymentTypeLabel')}</label>
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

            {saleType === 'credit' && (
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-text-secondary uppercase">{t('partialCashPaid')}</label>
                <input
                  type="number"
                  min={0}
                  max={getCartTotal()}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Math.min(getCartTotal(), Math.max(0, Number(e.target.value))))}
                />
                <span className="text-[9px] text-text-secondary">
                  {t('remainingChargedToCredit')} ${getCartTotal() - paidAmount}
                </span>
              </div>
            )}

            <button
              type="submit"
              className="btn-primary-green w-full py-3 text-xs font-bold flex items-center justify-center gap-2 mt-1"
            >
              <ShoppingCart className="w-4 h-4" />
              {t('checkout')}
            </button>
          </form>

        </GlassCard>
      )}

      {/* QR Scanner Modal Overlay */}
      {showScanner && (
        <QRScanner
          mode={scanMode}
          onScanSuccess={handleScanSuccess}
          onClose={() => setShowScanner(false)}
        />
      )}

    </div>
  );
};
