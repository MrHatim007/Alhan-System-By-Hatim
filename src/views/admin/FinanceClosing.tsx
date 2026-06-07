import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/TranslationContext';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/GlassCard';
import { 
  subscribeToCustodies, 
  subscribeToExpenses,
  subscribeToProducts,
  updateCustody,
  updateProduct,
  addExpense,
  deleteExpense,
  CustodyRecord,
  ExpenseRecord,
  ProductRecord
} from '../../services/dbService';
import { DollarSign, Truck, AlertOctagon, ClipboardCheck, ClipboardX, Plus, ListCollapse, Trash2 } from 'lucide-react';

export const FinanceClosing: React.FC = () => {
  const { t, language } = useTranslation();
  const { user } = useAuth();
  
  const [custodies, setCustodies] = useState<CustodyRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [products, setProducts] = useState<ProductRecord[]>([]);

  // Selection states
  const [activeReconciliationCustody, setActiveReconciliationCustody] = useState<CustodyRecord | null>(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // Expense form state
  const [expenseCat, setExpenseCat] = useState<'Fuel' | 'Vehicle Maintenance' | 'Warehouse Rent' | 'Salaries' | 'Other'>('Fuel');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState(0);

  // Daily closing form state
  const [physicalCashInput, setPhysicalCashInput] = useState(0);
  const [returnedCounts, setReturnedCounts] = useState<Record<string, number>>({});
  const [closingNotes, setClosingNotes] = useState('');

  const getItemPrice = (sku: string) => {
    return sku.startsWith('SHI') ? 65 : sku.startsWith('COA') ? 43 : 10;
  };

  // Compute discrepancy variables if custody is selected
  let expectedCash = 0;
  let actualCash = 0;
  let cashDiscrepancy = 0;
  let expectedStockValue = 0;
  let actualStockValue = 0;
  let stockDiscrepancyValue = 0;
  let netDiscrepancy = 0;

  if (activeReconciliationCustody) {
    expectedCash = activeReconciliationCustody.cashCollected;
    actualCash = Number(physicalCashInput);
    cashDiscrepancy = actualCash - expectedCash;

    expectedStockValue = activeReconciliationCustody.items.reduce((sum, item) => {
      const expectedRemaining = item.qtyTransferred - item.qtySold;
      return sum + (expectedRemaining * getItemPrice(item.sku));
    }, 0);

    actualStockValue = activeReconciliationCustody.items.reduce((sum, item) => {
      const actualCount = returnedCounts[item.productId] ?? (item.qtyTransferred - item.qtySold);
      return sum + (actualCount * getItemPrice(item.sku));
    }, 0);

    stockDiscrepancyValue = actualStockValue - expectedStockValue;
    netDiscrepancy = cashDiscrepancy + stockDiscrepancyValue;
  }

  useEffect(() => {
    const unsubCustodies = subscribeToCustodies(setCustodies);
    const unsubExpenses = subscribeToExpenses(setExpenses);
    const unsubProducts = subscribeToProducts(setProducts);

    return () => {
      unsubCustodies();
      unsubExpenses();
      unsubProducts();
    };
  }, []);

  const openReconciliation = (c: CustodyRecord) => {
    setActiveReconciliationCustody(c);
    setPhysicalCashInput(c.cashCollected); // default to reported cash
    setClosingNotes('');
    
    // Default returned stock counts to the expected remaining values
    const initialCounts: Record<string, number> = {};
    c.items.forEach(item => {
      const expectedRemaining = item.qtyTransferred - item.qtySold;
      initialCounts[item.productId] = expectedRemaining;
    });
    setReturnedCounts(initialCounts);
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (expenseAmount <= 0 || !expenseDesc) return;

    await addExpense({
      category: expenseCat,
      description: expenseDesc,
      amount: Number(expenseAmount),
      recordedBy: user?.name || 'Manager'
    });

    setExpenseDesc('');
    setExpenseAmount(0);
    setShowExpenseModal(false);
  };

  const handleReturnedCountChange = (productId: string, val: number) => {
    setReturnedCounts({
      ...returnedCounts,
      [productId]: Math.max(0, val)
    });
  };

  const handleReconcileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReconciliationCustody) return;

    try {
      const updatedItems = activeReconciliationCustody.items.map(item => {
        const expectedRemaining = item.qtyTransferred - item.qtySold;
        const actualReturned = returnedCounts[item.productId] ?? expectedRemaining;
        const discrepancy = expectedRemaining - actualReturned; // > 0 means missing, < 0 means extra

        return {
          ...item,
          qtyReturned: actualReturned,
          qtyDiscrepancy: discrepancy
        };
      });

      // Update Custody
      await updateCustody(activeReconciliationCustody.id, {
        status: 'closed',
        items: updatedItems,
        cashReceived: Number(physicalCashInput),
        closedAt: new Date().toISOString(),
        closedBy: user?.name || 'Admin',
        notes: closingNotes,
        archived: true
      });

      // Replenish warehouse inventory:
      // warehouseStock = warehouseStock + qtyReturned
      // vanStock = vanStock - qtyTransferred + qtySold (since custody is closed, and sold items were already deducted, we remove the remaining allocation)
      // Actually, when a custody closes:
      // vanStock of product drops by the expectedRemaining stock of that custody.
      // warehouseStock increments by the actual returned quantity.
      // The discrepancy quantity is a loss (permanently lost, not returned to warehouse, and removed from vanStock).
      for (const item of updatedItems) {
        const prod = products.find(p => p.id === item.productId);
        if (prod) {
          const expectedRemaining = item.qtyTransferred - item.qtySold;
          const actualReturned = item.qtyReturned;
          
          await updateProduct(prod.id, {
            warehouseStock: prod.warehouseStock + actualReturned,
            vanStock: Math.max(0, prod.vanStock - expectedRemaining)
          });
        }
      }

      setActiveReconciliationCustody(null);
      alert(t('reconcileSuccess'));
    } catch (err) {
      alert('Error finalizing reconciliation');
    }
  };

  const openCustodies = custodies.filter(c => c.status === 'open');

  return (
    <div className="flex flex-col gap-6">
      
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-wider mb-1">
            {t('menuFinance')}
          </h2>
          <p className="text-text-secondary text-sm">
            {t('financeDesc')}
          </p>
        </div>
        <button
          onClick={() => setShowExpenseModal(true)}
          className="btn-primary-pink flex items-center gap-2 text-sm py-2 px-4"
        >
          <Plus className="w-4 h-4" />
          {t('addNewExpense')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Pending closings */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <GlassCard glowColor="amber" className="p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Truck className="w-4 h-4 text-neon-amber" />
              {t('dailyClosing')}
            </h3>
            
            {openCustodies.length === 0 ? (
              <p className="text-text-muted text-sm text-center py-6">
                {t('noPendingClosings')}
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {openCustodies.map(c => (
                  <div 
                    key={c.id}
                    onClick={() => openReconciliation(c)}
                    className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-neon-amber/50 hover:bg-neon-amber/5 cursor-pointer transition-all flex justify-between items-center"
                  >
                    <div className="flex flex-col">
                      <strong className="text-white text-sm">{c.repName}</strong>
                      <span className="text-xs text-text-secondary">{c.date}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-text-secondary">Sales Cash:</span>
                      <strong className="text-neon-green font-mono text-sm">${c.cashCollected}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* Expenses Log Summary */}
          <GlassCard className="p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              {t('recentExpenses')}
            </h3>
            <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto custom-scrollbar">
              {expenses.length === 0 ? (
                <p className="text-text-muted text-xs text-center py-4">{t('noExpenses')}</p>
              ) : (
                expenses.map(exp => (
                  <div key={exp.id} className="p-3 rounded bg-slate-900 border border-slate-800 text-xs flex justify-between items-center gap-2">
                    <div className="flex flex-col gap-0.5 max-w-[65%]">
                      <span className="font-bold text-white">{exp.category}</span>
                      <span className="text-text-secondary">{exp.description}</span>
                      <span className="text-[10px] text-text-muted">{new Date(exp.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-bold text-neon-pink font-mono">${exp.amount}</span>
                      <button
                        onClick={async () => {
                          if (window.confirm(t('confirmDelete'))) {
                            await deleteExpense(exp.id);
                          }
                        }}
                        title={t('delete')}
                        className="p-1.5 rounded hover:bg-neon-pink/10 text-slate-400 hover:text-neon-pink flex items-center justify-center min-w-[28px] min-h-[28px]"
                      >
                        <Trash2 className="w-3.5 h-3.5 flex-shrink-0" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </div>

        {/* Right Side: Reconcile Form */}
        <div className="lg:col-span-2">
          {activeReconciliationCustody ? (
            <GlassCard glowColor="cyan" className="p-6">
              <h3 className="text-base font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-neon-cyan" />
                {t('reconciliationOf')}: {activeReconciliationCustody.repName} ({activeReconciliationCustody.date})
              </h3>

              <form onSubmit={handleReconcileSubmit} className="flex flex-col gap-6">
                
                {/* Cash reconciliation block */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-text-secondary font-bold uppercase">{t('repReportedCash')}</span>
                    <span className="text-2xl font-black text-neon-green font-mono">${activeReconciliationCustody.cashCollected}</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-text-secondary font-bold uppercase">{t('physicalCashReceived')} ($)</label>
                    <input
                      type="number"
                      value={physicalCashInput}
                      onChange={(e) => setPhysicalCashInput(Math.max(0, Number(e.target.value)))}
                      required
                      className="text-lg text-neon-green font-bold font-mono"
                    />
                    {physicalCashInput !== activeReconciliationCustody.cashCollected && (
                      <span className="text-[10px] text-neon-pink font-bold animate-pulse">
                        Cash discrepancy: ${physicalCashInput - activeReconciliationCustody.cashCollected}
                      </span>
                    )}
                  </div>
                </div>

                {/* Financial & Inventory Discrepancy Audit Engine */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-4">
                  <h4 className="text-xs font-bold text-neon-cyan uppercase tracking-wider border-b border-slate-800 pb-2 flex justify-between items-center">
                    <span>{language === 'ar' ? 'نظام احتساب العجز والزيادة (التقفيل المالي)' : 'Financial Discrepancy & Reconciliation Engine'}</span>
                    <span className="badge badge-partial px-2 py-0.5 text-[10px]">Real-Time Audit</span>
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    {/* Cash Audit Column */}
                    <div className="flex flex-col gap-2 p-3 rounded bg-slate-950/40 border border-slate-900">
                      <span className="font-bold text-text-secondary uppercase text-[10px]">{language === 'ar' ? 'تدقيق النقدية (Cash Audit)' : 'Cash Audit'}</span>
                      <div className="flex justify-between">
                        <span>{language === 'ar' ? 'النقد المتوقع (المبيعات):' : 'Expected Cash:'}</span>
                        <span className="font-mono text-white">${expectedCash.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{language === 'ar' ? 'النقد الفعلي المستلم:' : 'Actual Cash Handed Over:'}</span>
                        <span className="font-mono text-white">${actualCash.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-900 pt-1.5 mt-0.5">
                        <span className="font-bold">{language === 'ar' ? 'فارق النقدية:' : 'Cash Variance:'}</span>
                        <span className={`font-mono font-bold ${cashDiscrepancy < 0 ? 'text-neon-pink' : cashDiscrepancy > 0 ? 'text-neon-green' : 'text-text-muted'}`}>
                          {cashDiscrepancy > 0 ? `+${cashDiscrepancy}` : cashDiscrepancy}
                        </span>
                      </div>
                    </div>

                    {/* Inventory Audit Column */}
                    <div className="flex flex-col gap-2 p-3 rounded bg-slate-950/40 border border-slate-900">
                      <span className="font-bold text-text-secondary uppercase text-[10px]">{language === 'ar' ? 'تدقيق المخزون (Stock Audit)' : 'Inventory Value Audit'}</span>
                      <div className="flex justify-between">
                        <span>{language === 'ar' ? 'قيمة البضاعة المتوقعة:' : 'Expected Stock Value:'}</span>
                        <span className="font-mono text-white">${expectedStockValue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{language === 'ar' ? 'قيمة البضاعة الفعلية:' : 'Actual Counted Stock:'}</span>
                        <span className="font-mono text-white">${actualStockValue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-900 pt-1.5 mt-0.5">
                        <span className="font-bold">{language === 'ar' ? 'فارق المخزون:' : 'Stock Variance:'}</span>
                        <span className={`font-mono font-bold ${stockDiscrepancyValue < 0 ? 'text-neon-pink' : stockDiscrepancyValue > 0 ? 'text-neon-green' : 'text-text-muted'}`}>
                          {stockDiscrepancyValue > 0 ? `+${stockDiscrepancyValue}` : stockDiscrepancyValue}
                        </span>
                      </div>
                    </div>

                    {/* Total Net Assessment Column */}
                    <div className="flex flex-col gap-2 p-3 rounded bg-slate-950/40 border border-slate-900">
                      <span className="font-bold text-text-secondary uppercase text-[10px]">{language === 'ar' ? 'التقييم المالي الإجمالي' : 'Total Net Audit Assessment'}</span>
                      <div className="flex justify-between">
                        <span>{language === 'ar' ? 'إجمالي الأصول المتوقعة:' : 'Total Expected Assets:'}</span>
                        <span className="font-mono text-white">${(expectedCash + expectedStockValue).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{language === 'ar' ? 'إجمالي الأصول الفعلية:' : 'Total Actual Assets:'}</span>
                        <span className="font-mono text-white">${(actualCash + actualStockValue).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-900 pt-1.5 mt-0.5 font-bold">
                        <span>{language === 'ar' ? 'صافي العجز / الزيادة:' : 'Net Discrepancy Status:'}</span>
                        <span className={`font-mono text-sm ${netDiscrepancy < 0 ? 'text-neon-pink' : netDiscrepancy > 0 ? 'text-neon-green' : 'text-neon-cyan'}`}>
                          {netDiscrepancy < 0 
                            ? `${netDiscrepancy} (${language === 'ar' ? 'عجز' : 'Deficit'})` 
                            : netDiscrepancy > 0 
                              ? `+${netDiscrepancy} (${language === 'ar' ? 'زيادة' : 'Surplus'})` 
                              : `${language === 'ar' ? 'مطابق' : 'Reconciled'}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {netDiscrepancy < 0 && (
                    <div className="flex items-center gap-2 p-2 rounded bg-neon-pink/10 border border-neon-pink/20 text-neon-pink text-[10px] font-bold">
                      <AlertOctagon className="w-4 h-4 flex-shrink-0" />
                      <span>{language === 'ar' ? 'تحذير: تم الكشف عن عجز مالي في عهدة المندوب. يرجى مراجعة الجرد الفعلي ومطابقة المبالغ.' : 'Warning: Financial deficit detected in representative custody. Please verify counted stock and cash before closure.'}</span>
                    </div>
                  )}
                </div>

                {/* Stock reconciliation list */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-bold text-neon-cyan uppercase tracking-wider">
                    {t('vanCountingAndAudit')}
                  </h4>
                  <div className="dense-table-container border border-slate-850 rounded">
                    <table className="dense-table">
                      <thead>
                        <tr>
                          <th>{t('tableProduct')}</th>
                          <th className="text-center">{t('tableSent')}</th>
                          <th className="text-center">{t('tableSold')}</th>
                          <th className="text-center">{t('tableExpectedRemaining')}</th>
                          <th className="text-center w-28">{t('tableActualReturned')}</th>
                          <th className="text-right">{t('tableVariance')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeReconciliationCustody.items.map(item => {
                          const expectedRemaining = item.qtyTransferred - item.qtySold;
                          const actualCount = returnedCounts[item.productId] ?? expectedRemaining;
                          const variance = expectedRemaining - actualCount;

                          return (
                            <tr key={item.productId}>
                              <td>
                                <div className="flex flex-col">
                                  <span className="font-semibold text-white">{item.nameEn}</span>
                                  <span className="text-[10px] text-text-secondary font-mono">{item.sku}</span>
                                </div>
                              </td>
                              <td className="text-center text-text-secondary">{item.qtyTransferred}</td>
                              <td className="text-center text-neon-green">{item.qtySold}</td>
                              <td className="text-center text-white font-bold">{expectedRemaining}</td>
                              <td className="text-center">
                                <input
                                  type="number"
                                  min={0}
                                  value={actualCount}
                                  onChange={(e) => handleReturnedCountChange(item.productId, Number(e.target.value))}
                                  className="text-center py-1.5 px-2 bg-slate-950 text-white font-bold w-20 border border-slate-800"
                                />
                              </td>
                              <td className={`text-right font-mono font-bold ${variance === 0 ? 'text-text-muted' : 'text-neon-pink'}`}>
                                {variance > 0 ? `-${variance} (Loss)` : variance < 0 ? `+${Math.abs(variance)} (Excess)` : '0'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Notes */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-text-secondary font-bold uppercase">{t('notes')}</label>
                  <textarea
                    rows={2}
                    value={closingNotes}
                    onChange={(e) => setClosingNotes(e.target.value)}
                    placeholder={t('reconcileNotesPlaceholder')}
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
                  <button
                    type="button"
                    onClick={() => setActiveReconciliationCustody(null)}
                    className="btn-secondary py-2.5 px-5 text-xs"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    className="btn-primary-green py-2.5 px-6 text-xs"
                  >
                    {t('approveAndCloseDay')}
                  </button>
                </div>

              </form>
            </GlassCard>
          ) : (
            <GlassCard className="p-12 flex flex-col items-center justify-center text-center">
              <ClipboardCheck className="w-12 h-12 text-text-muted mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">{t('selectSheetToReconcile')}</h3>
              <p className="text-text-secondary text-sm max-w-sm">
                {t('selectSheetDesc')}
              </p>
            </GlassCard>
          )}
        </div>

      </div>

      {/* Record Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <GlassCard glowColor="pink" className="w-full max-w-md p-6 bg-slate-950 border border-slate-800">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-neon-pink" />
              {t('addNewExpense')}
            </h3>

            <form onSubmit={handleExpenseSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-text-secondary font-bold uppercase">{t('expenseCategory')}</label>
                <select
                  value={expenseCat}
                  onChange={(e) => setExpenseCat(e.target.value as any)}
                >
                  <option value="Fuel">Fuel</option>
                  <option value="Vehicle Maintenance">Vehicle Maintenance</option>
                  <option value="Warehouse Rent">Warehouse Rent</option>
                  <option value="Salaries">Salaries</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-text-secondary font-bold uppercase">{t('expenseAmount')} ($)</label>
                <input
                  type="number"
                  min={1}
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(Number(e.target.value))}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-text-secondary font-bold uppercase">{t('description')}</label>
                <input
                  type="text"
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  placeholder={t('expenseDescPlaceholder')}
                  required
                />
              </div>

              <div className="flex gap-3 justify-end mt-4">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="btn-secondary py-2 px-4 text-xs"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="btn-primary-pink py-2 px-6 text-xs"
                >
                  {t('saveExpense')}
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

    </div>
  );
};
