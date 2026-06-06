import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/TranslationContext';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/GlassCard';
import { QRScanner } from '../../components/QRScanner';
import { 
  subscribeToClients, 
  subscribeToCustodies, 
  subscribeToInvoices,
  addInvoice,
  ClientRecord,
  CustodyRecord,
  InvoiceRecord
} from '../../services/dbService';
import { ShoppingCart, Camera, AlertTriangle, Plus, Trash2, Printer, ChevronRight } from 'lucide-react';

export const RepPOS: React.FC = () => {
  const { t, language } = useTranslation();
  const { user } = useAuth();

  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [custodies, setCustodies] = useState<CustodyRecord[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);

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

  // GPS State
  const [gpsCoordinates, setGpsCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  // Receipt printable state
  const [completedInvoice, setCompletedInvoice] = useState<any | null>(null);

  useEffect(() => {
    const unsubClients = subscribeToClients(setClients);
    const unsubCust = subscribeToCustodies(setCustodies);
    const unsubInvoices = subscribeToInvoices(setInvoices);

    return () => {
      unsubClients();
      unsubCust();
      unsubInvoices();
    };
  }, []);

  // Capture GPS on client selection
  useEffect(() => {
    if (!selectedClientId) {
      setGpsCoordinates(null);
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsCoordinates({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (err) => {
          console.warn("GPS location access denied or unavailable:", err);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, [selectedClientId]);

  const activeCustody = custodies.find(c => c.repId === user?.id && c.status === 'open');
  const selectedClient = clients.find(c => c.id === selectedClientId);

  const getFavoriteProducts = () => {
    if (!selectedClientId || !activeCustody) return [];
    
    // Count items purchased by this client historically
    const productCounts: Record<string, number> = {};
    invoices
      .filter(inv => inv.clientId === selectedClientId)
      .forEach(inv => {
        inv.items.forEach(item => {
          productCounts[item.productId] = (productCounts[item.productId] || 0) + item.quantity;
        });
      });

    // Sort by count descending
    const sortedProductIds = Object.keys(productCounts).sort((a, b) => productCounts[b] - productCounts[a]);

    // Map to active custody items with remaining quantity
    return sortedProductIds
      .map(pId => {
        const custodyItem = activeCustody.items.find(item => item.productId === pId);
        if (!custodyItem) return null;
        const remaining = custodyItem.qtyTransferred - custodyItem.qtySold - custodyItem.qtyReturned;
        if (remaining <= 0) return null;
        return {
          ...custodyItem,
          remaining
        };
      })
      .filter(Boolean)
      .slice(0, 3); // top 3 favorites
  };

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
        custodyId: activeCustody.id,
        gps: gpsCoordinates ? { lat: gpsCoordinates.lat, lng: gpsCoordinates.lng } : null
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

  const handleThermalPrint = () => {
    document.body.classList.add('thermal-print-active');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('thermal-print-active');
    }, 800);
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
            {completedInvoice.gps && (
              <div className="text-[10px] text-neon-cyan mt-1">
                GPS: {completedInvoice.gps.lat.toFixed(5)}, {completedInvoice.gps.lng.toFixed(5)}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2.5 mt-6 w-full">
            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="btn-secondary flex-1 flex items-center justify-center gap-1.5 py-2 text-xs"
              >
                <Printer className="w-4 h-4" />
                {t('printReceipt')}
              </button>
              <button
                onClick={handleThermalPrint}
                className="btn-primary-cyan flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold"
              >
                <Printer className="w-4 h-4" />
                {language === 'ar' ? 'طباعة حرارية' : 'Thermal (58mm)'}
              </button>
            </div>
            <button
              onClick={() => setCompletedInvoice(null)}
              className="btn-primary-cyan w-full py-2.5 text-xs font-bold"
            >
              {t('backToPOS')}
            </button>
          </div>
        </GlassCard>

        {/* Thermal Receipt Layout (optimized for print, hidden on screen) */}
        <div className="thermal-receipt-container hidden">
          <div className="text-center font-bold text-sm uppercase">{t('receiptTitle')}</div>
          <div className="text-center text-[10px]">{t('shishaWholesale')}</div>
          <div className="text-center text-[9px]">Tel: +971 4 000 0000</div>
          <div>--------------------------------</div>
          <div>No: {completedInvoice.invoiceNumber}</div>
          <div>Date: {new Date(completedInvoice.date || Date.now()).toLocaleString()}</div>
          <div>Client: {language === 'ar' ? completedInvoice.clientNameAr : completedInvoice.clientNameEn}</div>
          <div>Rep: {completedInvoice.repName}</div>
          <div>--------------------------------</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8pt' }}>
            <thead>
              <tr style={{ borderBottom: '1px dashed #000' }}>
                <th style={{ textAlign: 'left' }}>Item</th>
                <th style={{ textAlign: 'center' }}>Qty</th>
                <th style={{ textAlign: 'right' }}>Price</th>
                <th style={{ textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {completedInvoice.items.map((item: any, idx: number) => (
                <tr key={idx}>
                  <td>{language === 'ar' ? item.nameAr : item.nameEn}</td>
                  <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right' }}>${item.unitPrice}</td>
                  <td style={{ textAlign: 'right' }}>${item.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div>--------------------------------</div>
          <div className="flex justify-between font-bold">
            <span>TOTAL:</span>
            <span>${completedInvoice.totalAmount}</span>
          </div>
          <div className="flex justify-between">
            <span>PAID:</span>
            <span>${completedInvoice.paidAmount}</span>
          </div>
          <div className="flex justify-between">
            <span>DUE:</span>
            <span>${completedInvoice.debtAmount}</span>
          </div>
          <div>--------------------------------</div>
          {completedInvoice.gps && (
            <div className="text-[8px] text-center">
              GPS: {completedInvoice.gps.lat.toFixed(5)}, {completedInvoice.gps.lng.toFixed(5)}
            </div>
          )}
          <div className="text-center mt-3 font-bold">*** THANK YOU ***</div>
        </div>
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

          {/* Quick Re-order Favorites Block */}
          {getFavoriteProducts().length > 0 && (
            <div className="flex flex-col gap-2 p-3 bg-slate-950/40 border border-slate-900 rounded-lg">
              <span className="text-[10px] text-neon-cyan font-bold uppercase tracking-wider block mb-1">
                {language === 'ar' ? '⭐ الطلب السريع / المفضلة للعميل' : '⭐ Quick Re-order / Client Favorites'}
              </span>
              <div className="flex flex-wrap gap-2">
                {getFavoriteProducts().map((fav: any) => (
                  <button
                    key={fav.productId}
                    type="button"
                    onClick={() => {
                      setCurrProductId(fav.productId);
                      setCurrQty(1);
                    }}
                    className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-neon-cyan/50 hover:bg-neon-cyan/10 text-xs text-white transition-all flex items-center gap-1.5"
                  >
                    <span className="font-semibold">{language === 'ar' ? fav.nameAr : fav.nameEn}</span>
                    <span className="text-[9px] text-text-muted font-mono">{fav.sku}</span>
                    <span className="px-1.5 py-0.5 rounded bg-neon-cyan/20 text-neon-cyan font-bold text-[8px] font-mono">
                      {fav.remaining} {language === 'ar' ? 'متاح' : 'left'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleAddToCart} className="flex flex-col gap-3 mt-1">
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
