import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/TranslationContext';
import { GlassCard } from '../../components/GlassCard';
import { 
  subscribeToProducts, 
  subscribeToUsers, 
  subscribeToCustodies, 
  addCustody,
  ProductRecord, 
  UserRecord,
  CustodyRecord
} from '../../services/dbService';
import { ArrowLeftRight, Trash2, Plus, Send, AlertTriangle } from 'lucide-react';

interface TransferDraftItem {
  productId: string;
  sku: string;
  nameEn: string;
  nameAr: string;
  qtyToTransfer: number;
}

export const StockTransfer: React.FC = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [custodies, setCustodies] = useState<CustodyRecord[]>([]);

  // Selection states
  const [selectedRepId, setSelectedRepId] = useState('');
  const [transferCart, setTransferCart] = useState<TransferDraftItem[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Cart addition form state
  const [selectedProductId, setSelectedProductId] = useState('');
  const [inputQty, setInputQty] = useState<number>(0);

  useEffect(() => {
    const unsubProducts = subscribeToProducts(setProducts);
    const unsubUsers = subscribeToUsers((data) => {
      // Filter only representatives (Mandoob)
      setUsers(data.filter(u => u.role === 'rep' && u.status === 'active'));
    });
    const unsubCustodies = subscribeToCustodies(setCustodies);

    return () => {
      unsubProducts();
      unsubUsers();
      unsubCustodies();
    };
  }, []);

  const selectedRep = users.find(u => u.id === selectedRepId);
  const activeCustody = custodies.find(c => c.repId === selectedRepId && c.status === 'open');
  const selectedProduct = products.find(p => p.id === selectedProductId);

  // Add item to draft transfer list
  const handleAddToCart = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!selectedProductId || inputQty <= 0) return;

    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    // Check if transfer exceeds available warehouse stock
    if (inputQty > prod.warehouseStock) {
      setErrorMsg(t('transferExceeded'));
      return;
    }

    // Check if already in cart
    const existingIndex = transferCart.findIndex(item => item.productId === selectedProductId);
    if (existingIndex !== -1) {
      const currentQty = transferCart[existingIndex].qtyToTransfer;
      if (currentQty + inputQty > prod.warehouseStock) {
        setErrorMsg(t('transferExceeded'));
        return;
      }
      const updated = [...transferCart];
      updated[existingIndex].qtyToTransfer += inputQty;
      setTransferCart(updated);
    } else {
      setTransferCart([...transferCart, {
        productId: prod.id,
        sku: prod.sku,
        nameEn: prod.nameEn,
        nameAr: prod.nameAr,
        qtyToTransfer: inputQty
      }]);
    }

    // Reset inputs
    setSelectedProductId('');
    setInputQty(0);
  };

  const handleRemoveFromCart = (index: number) => {
    setTransferCart(transferCart.filter((_, i) => i !== index));
  };

  // Submit transfer to database
  const handleIssueTransfer = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (transferCart.length === 0) {
      setErrorMsg(t('transferEmpty'));
      return;
    }

    if (!selectedRepId || !selectedRep) {
      setErrorMsg('Please select a Representative');
      return;
    }

    try {
      // If the rep has an active custody, we will merge the items.
      // If not, we will create a new custody.
      if (activeCustody) {
        const mergedItems = [...activeCustody.items];
        
        transferCart.forEach(cartItem => {
          const custodyItemIndex = mergedItems.findIndex(ci => ci.productId === cartItem.productId);
          if (custodyItemIndex !== -1) {
            mergedItems[custodyItemIndex].qtyTransferred += cartItem.qtyToTransfer;
          } else {
            mergedItems.push({
              productId: cartItem.productId,
              sku: cartItem.sku,
              nameEn: cartItem.nameEn,
              nameAr: cartItem.nameAr,
              qtyTransferred: cartItem.qtyToTransfer,
              qtyReturned: 0,
              qtySold: 0,
              qtyDiscrepancy: 0
            });
          }
        });

        // 1. Update Custody record
        const custodyList = JSON.parse(localStorage.getItem('alhan_mock_custodies') || '[]');
        const updatedCustodies = custodyList.map((c: any) => c.id === activeCustody.id ? { ...c, items: mergedItems } : c);
        localStorage.setItem('alhan_mock_custodies', JSON.stringify(updatedCustodies));
        
        // 2. Adjust stocks: deduct warehouseStock and increment vanStock
        const prodList = JSON.parse(localStorage.getItem('alhan_mock_products') || '[]');
        transferCart.forEach(cartItem => {
          const prodIdx = prodList.findIndex((p: any) => p.id === cartItem.productId);
          if (prodIdx !== -1) {
            prodList[prodIdx].warehouseStock = Math.max(0, prodList[prodIdx].warehouseStock - cartItem.qtyToTransfer);
            prodList[prodIdx].vanStock += cartItem.qtyToTransfer;
          }
        });
        localStorage.setItem('alhan_mock_products', JSON.stringify(prodList));
        
        // Trigger live sub updates
        window.dispatchEvent(new Event('storage'));
        // Hacky way to trigger React state reload on dbService subscribers
        // Since resetMockDatabase triggers pubsub, we'll just save locally
        // using the normal dbService wrappers (we did that in addCustody, so let's use a similar pattern).
        // Since we are writing standalone logic, we can also write a clean mock updates emitter.
        // Actually, our dbService.ts saves using saveLocalCollection!
        // Let's make sure we trigger it by calling the dbService functions.
        // Let's call standard addCustody if creating, or updateCustody.
        // Let's implement that!
        
        const { updateCustody, updateProduct } = await import('../../services/dbService');
        await updateCustody(activeCustody.id, { items: mergedItems });
        
        for (const cartItem of transferCart) {
          const prod = products.find(p => p.id === cartItem.productId);
          if (prod) {
            await updateProduct(prod.id, {
              warehouseStock: Math.max(0, prod.warehouseStock - cartItem.qtyToTransfer),
              vanStock: prod.vanStock + cartItem.qtyToTransfer
            });
          }
        }
      } else {
        // Create new Custody
        const custodyItems = transferCart.map(ci => ({
          productId: ci.productId,
          sku: ci.sku,
          nameEn: ci.nameEn,
          nameAr: ci.nameAr,
          qtyTransferred: ci.qtyToTransfer,
          qtyReturned: 0,
          qtySold: 0,
          qtyDiscrepancy: 0
        }));

        await addCustody({
          repId: selectedRepId,
          repName: selectedRep.name,
          items: custodyItems
        });
      }

      setSuccessMsg(t('transferSuccess'));
      setTransferCart([]);
    } catch (err) {
      setErrorMsg('Error performing stock transfer');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-white uppercase tracking-wider mb-1">
          {t('menuStockTransfer')}
        </h2>
        <p className="text-text-secondary text-sm">
          Distribute stock from main warehouse to representatives' van inventory custody (عهدة).
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Rep Selector and Current Van Inventory */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <GlassCard className="p-6 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-neon-cyan" />
              {t('selectRep')}
            </h3>

            <select
              value={selectedRepId}
              onChange={(e) => {
                setSelectedRepId(e.target.value);
                setTransferCart([]);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className="text-sm"
            >
              <option value="">-- Choose Representative --</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </GlassCard>

          {/* Active Custody Status */}
          {selectedRepId && (
            <GlassCard glowColor={activeCustody ? 'cyan' : 'none'} className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  {t('currentCustodyItems')}
                </h3>
                <span className={`badge ${activeCustody ? 'badge-partial animate-pulse' : 'badge-unpaid'}`}>
                  {activeCustody ? 'Active Custody (Open)' : 'No Active Custody'}
                </span>
              </div>

              {activeCustody && activeCustody.items.length > 0 ? (
                <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {activeCustody.items.map(item => {
                    const remaining = item.qtyTransferred - item.qtyReturned - item.qtySold;
                    return (
                      <div key={item.productId} className="flex justify-between items-center py-2 border-b border-white/5 text-sm">
                        <div className="flex flex-col">
                          <span className="font-semibold text-white">{item.nameEn}</span>
                          <span className="text-xs text-text-muted font-mono">{item.sku}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col items-end">
                            <span className="font-bold text-neon-cyan">{remaining} Qty</span>
                            <span className="text-[10px] text-text-secondary">Issued: {item.qtyTransferred}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-text-muted text-sm py-4">
                  Representative has no products currently in custody.
                </p>
              )}
            </GlassCard>
          )}
        </div>

        {/* Right Side: Draft Transfer Order */}
        {selectedRepId ? (
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Messages */}
            {errorMsg && (
              <div className="p-4 rounded-lg bg-neon-pink/15 border border-neon-pink/30 text-neon-pink text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>{errorMsg}</span>
              </div>
            )}
            
            {successMsg && (
              <div className="p-4 rounded-lg bg-neon-green/15 border border-neon-green/30 text-neon-green text-sm">
                {successMsg}
              </div>
            )}

            {/* Transfer Cart Addition */}
            <GlassCard className="p-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
                Add Products to Transfer Draft
              </h3>
              <form onSubmit={handleAddToCart} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="flex flex-col gap-1.5 md:col-span-1">
                  <label className="text-xs text-text-secondary font-bold uppercase">Select Product</label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="text-sm"
                  >
                    <option value="">-- Choose Item --</option>
                    {products
                      .filter(p => p.warehouseStock > 0)
                      .map(p => (
                        <option key={p.id} value={p.id}>
                          {p.sku} - {p.nameEn} ({p.warehouseStock} available)
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-text-secondary font-bold uppercase">{t('qtyToTransfer')}</label>
                  <input
                    type="number"
                    min={1}
                    value={inputQty || ''}
                    onChange={(e) => setInputQty(Math.max(0, Number(e.target.value)))}
                    placeholder="Enter Quantity"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!selectedProductId || inputQty <= 0}
                  className="btn-primary-cyan flex items-center justify-center gap-2 py-3 px-4 text-sm disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  Add to List
                </button>
              </form>
            </GlassCard>

            {/* Transfer List Table */}
            <GlassCard glowColor="cyan" className="p-6 flex flex-col gap-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Transfer Cart Items
              </h3>
              
              <div className="dense-table-container max-h-[300px] overflow-y-auto custom-scrollbar">
                <table className="dense-table">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Product Name</th>
                      <th>Qty to Send</th>
                      <th>Available Warehouse</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transferCart.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center text-text-muted py-6">
                          No items added to transfer order yet.
                        </td>
                      </tr>
                    ) : (
                      transferCart.map((item, idx) => {
                        const prod = products.find(p => p.id === item.productId);
                        return (
                          <tr key={item.productId}>
                            <td className="font-mono text-neon-cyan font-semibold">{item.sku}</td>
                            <td>{item.nameEn}</td>
                            <td className="font-bold text-white">{item.qtyToTransfer}</td>
                            <td className="text-text-secondary">{prod?.warehouseStock}</td>
                            <td>
                              <button
                                onClick={() => handleRemoveFromCart(idx)}
                                className="p-1 text-neon-pink hover:bg-neon-pink/10 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {transferCart.length > 0 && (
                <div className="flex justify-end mt-4">
                  <button
                    onClick={handleIssueTransfer}
                    className="btn-primary-cyan flex items-center gap-2 py-3 px-6"
                  >
                    <Send className="w-4 h-4" />
                    {t('issueTransferBtn')}
                  </button>
                </div>
              )}
            </GlassCard>

          </div>
        ) : (
          <GlassCard className="lg:col-span-2 p-12 flex flex-col items-center justify-center text-center">
            <ArrowLeftRight className="w-12 h-12 text-text-muted mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Representative Selected</h3>
            <p className="text-text-secondary text-sm max-w-sm">
              Please choose a sales representative from the left sidebar to issue a stock custody transfer order.
            </p>
          </GlassCard>
        )}

      </div>

    </div>
  );
};
