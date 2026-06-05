import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/TranslationContext';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/GlassCard';
import { 
  subscribeToCustodies, 
  subscribeToClients,
  updateCustody,
  updateClient,
  updateProduct,
  CustodyRecord,
  ClientRecord,
  ProductRecord,
  subscribeToProducts
} from '../../services/dbService';
import { PackageOpen, AlertTriangle, ArrowLeftRight, Save } from 'lucide-react';

export const RepCustodyCheck: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [custodies, setCustodies] = useState<CustodyRecord[]>([]);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [products, setProducts] = useState<ProductRecord[]>([]);

  // Returns state
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [returnQty, setReturnQty] = useState(1);

  useEffect(() => {
    const unsubCust = subscribeToCustodies(setCustodies);
    const unsubClients = subscribeToClients(setClients);
    const unsubProducts = subscribeToProducts(setProducts);

    return () => {
      unsubCust();
      unsubClients();
      unsubProducts();
    };
  }, []);

  const activeCustody = custodies.find(c => c.repId === user?.id && c.status === 'open');

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustody || !selectedClientId || !selectedProductId || returnQty <= 0) return;

    const client = clients.find(c => c.id === selectedClientId);
    const custodyItem = activeCustody.items.find(item => item.productId === selectedProductId);
    const prod = products.find(p => p.id === selectedProductId);

    if (!client || !custodyItem || !prod) return;

    try {
      // 1. Calculate price offset to credit customer debt
      const price = custodyItem.sku.startsWith('SHI') ? 65 : custodyItem.sku.startsWith('COA') ? 43 : 10;
      const creditAmount = returnQty * price;

      // 2. Reduce client's outstanding debt
      const updatedDebt = Math.max(0, client.outstandingDebt - creditAmount);
      await updateClient(client.id, { outstandingDebt: updatedDebt });

      // 3. Revert custody item qtySold:
      // Decrementing qtySold means the item goes back into the remaining van stock
      const updatedItems = activeCustody.items.map(item => {
        if (item.productId === selectedProductId) {
          return {
            ...item,
            qtySold: Math.max(0, item.qtySold - returnQty)
          };
        }
        return item;
      });

      await updateCustody(activeCustody.id, { items: updatedItems });

      // 4. Increment the global product's vanStock
      await updateProduct(prod.id, {
        vanStock: prod.vanStock + returnQty
      });

      setShowReturnModal(false);
      setSelectedClientId('');
      setSelectedProductId('');
      setReturnQty(1);
      
      alert(t('returnSuccess'));
    } catch (err) {
      alert('Error logging returns');
    }
  };

  return (
    <div className="flex flex-col gap-5 pb-12">
      
      {/* Title */}
      <div className="flex justify-between items-center">
        <h2 className="text-base font-bold text-white uppercase tracking-wider">
          {t('vanInventoryList')}
        </h2>
        
        {activeCustody && (
          <button
            onClick={() => setShowReturnModal(true)}
            className="btn-primary-pink py-1.5 px-3 text-xs"
          >
            {t('logCustomerReturn')}
          </button>
        )}
      </div>

      {/* Custody Sheet Card */}
      {activeCustody ? (
        <div className="flex flex-col gap-4">
          
          {/* Metadata */}
          <GlassCard className="p-4 flex justify-between text-xs text-text-secondary">
            <span>Date Opened: <strong className="text-white font-mono">{activeCustody.date}</strong></span>
            <span>Items Count: <strong className="text-white font-mono">{activeCustody.items.length}</strong></span>
          </GlassCard>

          {/* Table */}
          <GlassCard glowColor="pink" className="p-4">
            <div className="flex flex-col gap-3">
              {activeCustody.items.map(item => {
                const remaining = item.qtyTransferred - item.qtyReturned - item.qtySold;
                return (
                  <div key={item.productId} className="flex justify-between items-center py-2.5 border-b border-slate-900 text-xs">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-white">{item.nameEn}</span>
                      <span className="text-[10px] text-text-secondary font-mono">{item.sku}</span>
                    </div>
                    <div className="flex gap-4 text-right">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-text-secondary">Sold / Sent</span>
                        <span className="font-mono text-white">{item.qtySold} / {item.qtyTransferred}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-neon-cyan font-bold">Remaining</span>
                        <strong className="font-mono text-neon-cyan font-bold text-sm">{remaining}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>

        </div>
      ) : (
        <GlassCard className="p-10 text-center flex flex-col items-center justify-center">
          <PackageOpen className="w-12 h-12 text-text-muted mb-3" />
          <p className="text-text-secondary text-sm">No active custody. Van stock is empty.</p>
        </GlassCard>
      )}

      {/* Log Client Return Modal */}
      {showReturnModal && activeCustody && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <GlassCard glowColor="pink" className="w-full max-w-md p-6 bg-slate-950 border border-slate-800">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-neon-pink" />
              {t('logCustomerReturn')}
            </h3>

            <form onSubmit={handleReturnSubmit} className="flex flex-col gap-4">
              
              {/* Select Client */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-text-secondary">Select Client returning goods</label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  required
                  className="text-sm"
                >
                  <option value="">-- Choose Cafe --</option>
                  {clients
                    .filter(c => c.outstandingDebt > 0)
                    .map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nameEn} (Debt: ${c.outstandingDebt})
                      </option>
                    ))}
                </select>
              </div>

              {/* Select Product */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-text-secondary">Select Product being returned</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  required
                  className="text-sm"
                >
                  <option value="">-- Select Product --</option>
                  {activeCustody.items.map(item => (
                    <option key={item.productId} value={item.productId}>
                      {item.sku} - {item.nameEn} (Sold: {item.qtySold})
                    </option>
                  ))}
                </select>
              </div>

              {/* Qty */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-text-secondary">Quantity Returned</label>
                <input
                  type="number"
                  min={1}
                  value={returnQty}
                  onChange={(e) => setReturnQty(Math.max(1, Number(e.target.value)))}
                  required
                />
              </div>

              <div className="flex gap-3 justify-end mt-4">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="btn-secondary py-2 px-4 text-xs"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="btn-primary-pink py-2 px-6 text-xs flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  {t('logReturnBtn')}
                </button>
              </div>

            </form>
          </GlassCard>
        </div>
      )}

    </div>
  );
};
