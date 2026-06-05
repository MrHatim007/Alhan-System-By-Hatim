import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/TranslationContext';
import { GlassCard } from '../../components/GlassCard';
import { 
  subscribeToInvoices, 
  subscribeToExpenses, 
  subscribeToCustodies, 
  subscribeToProducts,
  InvoiceRecord,
  ExpenseRecord,
  CustodyRecord,
  ProductRecord
} from '../../services/dbService';
import { FileBarChart2, DollarSign, Package, UserCheck, TrendingDown } from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { t } = useTranslation();
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [custodies, setCustodies] = useState<CustodyRecord[]>([]);
  const [products, setProducts] = useState<ProductRecord[]>([]);

  // Sub-reports tabs
  const [activeReportTab, setActiveReportTab] = useState<'pl' | 'inventory' | 'reps'>('pl');

  useEffect(() => {
    const unsubInvoices = subscribeToInvoices(setInvoices);
    const unsubExpenses = subscribeToExpenses(setExpenses);
    const unsubCustodies = subscribeToCustodies(setCustodies);
    const unsubProducts = subscribeToProducts(setProducts);

    return () => {
      unsubInvoices();
      unsubExpenses();
      unsubCustodies();
      unsubProducts();
    };
  }, []);

  // --- Calculations ---

  // 1. Profit & Loss Metrics
  const getPLStatement = () => {
    const grossSales = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    
    // COGS = quantity * costPrice snapshotted in invoice items
    const cogs = invoices.reduce((sum, inv) => {
      const invoiceCogs = inv.items.reduce((iSum, item) => iSum + (item.quantity * (item.costPrice || 0)), 0);
      return sum + invoiceCogs;
    }, 0);

    const grossProfit = grossSales - cogs;
    const totalExp = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const netProfit = grossProfit - totalExp;

    return { grossSales, cogs, grossProfit, totalExp, netProfit };
  };

  const pl = getPLStatement();

  // 2. Representative Performance Metrics
  const getRepPerformance = () => {
    const reps: Record<string, { 
      name: string; 
      sales: number; 
      invoiceCount: number; 
      cashCollected: number; 
      discrepancyCount: number 
    }> = {};

    invoices.forEach(inv => {
      if (inv.repId === 'warehouse') return; // Skip warehouse direct
      
      if (!reps[inv.repId]) {
        reps[inv.repId] = { name: inv.repName, sales: 0, invoiceCount: 0, cashCollected: 0, discrepancyCount: 0 };
      }
      
      reps[inv.repId].sales += inv.totalAmount;
      reps[inv.repId].invoiceCount += 1;
      reps[inv.repId].cashCollected += inv.paidAmount;
    });

    // Add discrepancy count from closed custodies
    custodies.forEach(c => {
      if (c.status === 'closed' && reps[c.repId]) {
        const totalDiscrepancies = c.items.reduce((sum, item) => sum + Math.abs(item.qtyDiscrepancy), 0);
        reps[c.repId].discrepancyCount += totalDiscrepancies;
      }
    });

    return Object.values(reps);
  };

  const repPerformance = getRepPerformance();

  // 3. Inventory Reconciliation (Discrepancies count per product)
  const getInventoryRecon = () => {
    const recon: Record<string, { 
      sku: string; 
      name: string; 
      category: string; 
      warehouseStock: number; 
      vanStock: number;
      discrepancyCount: number;
    }> = {};

    // Base products
    products.forEach(p => {
      recon[p.id] = {
        sku: p.sku,
        name: p.nameEn,
        category: p.category,
        warehouseStock: p.warehouseStock,
        vanStock: p.vanStock,
        discrepancyCount: 0
      };
    });

    // Accumulate closed custody discrepancies
    custodies.forEach(c => {
      if (c.status === 'closed') {
        c.items.forEach(item => {
          if (recon[item.productId]) {
            recon[item.productId].discrepancyCount += item.qtyDiscrepancy;
          }
        });
      }
    });

    return Object.values(recon);
  };

  const inventoryRecon = getInventoryRecon();

  return (
    <div className="flex flex-col gap-6">
      
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-white uppercase tracking-wider mb-1">
          {t('menuReports')}
        </h2>
        <p className="text-text-secondary text-sm">
          Internal financial reporting, P&L, stock auditories, representative KPIs.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-4">
        <button
          onClick={() => setActiveReportTab('pl')}
          className={`py-3 px-4 text-sm font-bold border-b-2 transition-all ${
            activeReportTab === 'pl' 
              ? 'border-neon-cyan text-neon-cyan text-glow-cyan' 
              : 'border-transparent text-text-secondary hover:text-white'
          }`}
        >
          {t('profitAndLoss')}
        </button>
        <button
          onClick={() => setActiveReportTab('inventory')}
          className={`py-3 px-4 text-sm font-bold border-b-2 transition-all ${
            activeReportTab === 'inventory' 
              ? 'border-neon-cyan text-neon-cyan text-glow-cyan' 
              : 'border-transparent text-text-secondary hover:text-white'
          }`}
        >
          {t('inventoryReconciliation')}
        </button>
        <button
          onClick={() => setActiveReportTab('reps')}
          className={`py-3 px-4 text-sm font-bold border-b-2 transition-all ${
            activeReportTab === 'reps' 
              ? 'border-neon-cyan text-neon-cyan text-glow-cyan' 
              : 'border-transparent text-text-secondary hover:text-white'
          }`}
        >
          {t('repPerformance')}
        </button>
      </div>

      {/* TAB CONTENT */}

      {/* 1. Profit & Loss Statement */}
      {activeReportTab === 'pl' && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard glowColor="green" className="p-6">
              <span className="text-text-secondary text-xs font-bold uppercase block mb-1">Total Sales Revenue</span>
              <strong className="text-2xl font-black text-white text-glow-green font-mono">${pl.grossSales}</strong>
            </GlassCard>
            <GlassCard glowColor="pink" className="p-6">
              <span className="text-text-secondary text-xs font-bold uppercase block mb-1">Total Operating Expenses</span>
              <strong className="text-2xl font-black text-white text-glow-pink font-mono">${pl.totalExp}</strong>
            </GlassCard>
            <GlassCard glowColor="cyan" className="p-6">
              <span className="text-text-secondary text-xs font-bold uppercase block mb-1">Net Operating Profit</span>
              <strong className="text-2xl font-black text-white text-glow-cyan font-mono">${pl.netProfit}</strong>
            </GlassCard>
          </div>

          <GlassCard className="p-8 max-w-2xl mx-auto w-full">
            <h3 className="text-center text-base font-bold text-white uppercase tracking-wider mb-6 pb-4 border-b border-slate-800">
              {t('profitAndLoss')} Statement
            </h3>
            
            <div className="flex flex-col gap-4 text-sm text-text-secondary">
              
              <div className="flex justify-between items-center py-2 border-b border-slate-900">
                <span className="font-semibold text-white">{t('grossSales')} (+)</span>
                <span className="font-mono text-white font-bold">${pl.grossSales}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-900">
                <span className="font-semibold text-white">{t('costOfGoodsSold')} (-)</span>
                <span className="font-mono text-neon-pink">${pl.cogs}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-800 font-bold text-white bg-white/5 px-3 rounded">
                <span>{t('grossProfit')}</span>
                <span className="font-mono text-neon-green">${pl.grossProfit}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-900">
                <span className="font-semibold text-white">{t('totalExpenses')} (-)</span>
                <span className="font-mono text-neon-pink">${pl.totalExp}</span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-slate-800 font-black text-white bg-neon-cyan/5 border border-neon-cyan/20 px-3 rounded text-base">
                <span className="text-glow-cyan uppercase">{t('netProfit')}</span>
                <span className="font-mono text-neon-cyan">${pl.netProfit}</span>
              </div>

            </div>
          </GlassCard>
        </div>
      )}

      {/* 2. Inventory Reconciliation */}
      {activeReportTab === 'inventory' && (
        <GlassCard className="p-6">
          <div className="dense-table-container">
            <table className="dense-table">
              <thead>
                <tr>
                  <th>{t('sku')}</th>
                  <th>{t('productName')}</th>
                  <th>{t('category')}</th>
                  <th>{t('warehouseStock')}</th>
                  <th>{t('vanStock')}</th>
                  <th>Total Stock</th>
                  <th className="text-right">Lost Discrepancies (Qty)</th>
                </tr>
              </thead>
              <tbody>
                {inventoryRecon.map(item => (
                  <tr key={item.sku}>
                    <td className="font-mono text-neon-cyan font-semibold">{item.sku}</td>
                    <td className="text-white font-medium">{item.name}</td>
                    <td>{item.category}</td>
                    <td className="text-white font-mono">{item.warehouseStock}</td>
                    <td className="text-text-secondary font-mono">{item.vanStock}</td>
                    <td className="font-bold text-white font-mono">{item.warehouseStock + item.vanStock}</td>
                    <td className={`text-right font-mono font-bold ${item.discrepancyCount > 0 ? 'text-neon-pink text-glow-pink' : 'text-text-muted'}`}>
                      {item.discrepancyCount} tins/boxes
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* 3. Mandoob KPIs */}
      {activeReportTab === 'reps' && (
        <GlassCard className="p-6">
          <div className="dense-table-container">
            <table className="dense-table">
              <thead>
                <tr>
                  <th>{t('fullName')}</th>
                  <th>{t('invoicesCount')}</th>
                  <th>{t('todaySales')}</th>
                  <th>{t('todayCashCollected')}</th>
                  <th className="text-right">{t('discrepancy')} Loss (Units)</th>
                </tr>
              </thead>
              <tbody>
                {repPerformance.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-text-muted py-6">
                      No representative sales data recorded yet.
                    </td>
                  </tr>
                ) : (
                  repPerformance.map(rep => (
                    <tr key={rep.name}>
                      <td className="font-semibold text-white">{rep.name}</td>
                      <td className="font-mono">{rep.invoiceCount}</td>
                      <td className="text-neon-green font-mono font-bold">${rep.sales}</td>
                      <td className="text-text-secondary font-mono">${rep.cashCollected}</td>
                      <td className={`text-right font-mono font-bold ${rep.discrepancyCount > 0 ? 'text-neon-pink' : 'text-text-muted'}`}>
                        {rep.discrepancyCount} units
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

    </div>
  );
};
