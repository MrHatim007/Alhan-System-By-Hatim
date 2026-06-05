import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/TranslationContext';
import { GlassCard } from '../../components/GlassCard';
import { CustomChart } from '../../components/CustomChart';
import { 
  subscribeToProducts, 
  subscribeToInvoices, 
  subscribeToExpenses,
  ProductRecord, 
  InvoiceRecord,
  ExpenseRecord
} from '../../services/dbService';
import { TrendingUp, DollarSign, Truck, AlertTriangle, Package } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);

  useEffect(() => {
    const unsubProducts = subscribeToProducts(setProducts);
    const unsubInvoices = subscribeToInvoices(setInvoices);
    const unsubExpenses = subscribeToExpenses(setExpenses);

    return () => {
      unsubProducts();
      unsubInvoices();
      unsubExpenses();
    };
  }, []);

  // --- Calculations ---

  // 1. Daily Sales (Sales created today)
  const getTodaySales = () => {
    const today = new Date().toISOString().split('T')[0];
    return invoices
      .filter(inv => inv.date.startsWith(today))
      .reduce((sum, inv) => sum + inv.totalAmount, 0);
  };

  // 2. Cash in Safe
  // Standard Cash = (Sum of Cash Sales) + (Cash received from closed custodies) - (Expenses)
  const getCashInSafe = () => {
    const cashSales = invoices
      .filter(inv => inv.type === 'cash')
      .reduce((sum, inv) => sum + inv.paidAmount, 0);
      
    // Include credit invoice partial payments
    const creditPayments = invoices
      .filter(inv => inv.type === 'credit')
      .reduce((sum, inv) => sum + inv.paidAmount, 0);

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    // Starting cash in safe is 5000
    return Math.max(0, 5000 + cashSales + creditPayments - totalExpenses);
  };

  // 3. Total Van Stock Value (Selling price * vanStock)
  const getVanStockValue = () => {
    return products.reduce((sum, prod) => sum + (prod.vanStock * prod.sellingPrice), 0);
  };

  // 4. Low Stock Alerts count
  const getLowStockCount = () => {
    return products.filter(prod => prod.warehouseStock <= prod.minStockAlert).length;
  };

  // --- Chart Data ---

  // Sales Trend (Last 5 days)
  const getSalesTrendData = () => {
    const days = 5;
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' });
      
      const daySales = invoices
        .filter(inv => inv.date.startsWith(dateStr))
        .reduce((sum, inv) => sum + inv.totalAmount, 0);

      result.push({ label, value: daySales });
    }
    return result;
  };

  // Top Selling Products
  const getTopProductsData = () => {
    const productCounts: Record<string, { name: string; value: number }> = {};
    
    invoices.forEach(inv => {
      inv.items.forEach(item => {
        if (!productCounts[item.productId]) {
          productCounts[item.productId] = { 
            name: item.nameEn, // Fallback, would be nice to choose based on lang
            value: 0 
          };
        }
        productCounts[item.productId].value += item.quantity * item.unitPrice;
      });
    });

    return Object.values(productCounts)
      .sort((a, b) => b.value - a.value)
      .slice(0, 4)
      .map(p => ({ label: p.name, value: p.value }));
  };

  // Low stock products list
  const lowStockProducts = products.filter(p => p.warehouseStock <= p.minStockAlert);

  return (
    <div className="flex flex-col gap-6">
      
      {/* Page Title */}
      <div>
        <h2 className="text-xl font-bold text-white uppercase tracking-wider mb-1">
          {t('menuDashboard')}
        </h2>
        <p className="text-text-secondary text-sm">
          {t('metricsTitle')}
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid-cols-auto-fit">
        
        {/* Daily Sales */}
        <GlassCard glowColor="green" className="p-6 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-2">
                {t('dailySales')}
              </span>
              <span className="text-3xl font-black text-white text-glow-green">
                ${getTodaySales().toLocaleString()}
              </span>
            </div>
            <div className="p-3 bg-neon-green/10 border border-neon-green/20 rounded-xl text-neon-green">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-neon-green/5 rounded-full blur-xl"></div>
        </GlassCard>

        {/* Cash in Safe */}
        <GlassCard glowColor="cyan" className="p-6 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-2">
                {t('cashInSafe')}
              </span>
              <span className="text-3xl font-black text-white text-glow-cyan">
                ${getCashInSafe().toLocaleString()}
              </span>
            </div>
            <div className="p-3 bg-neon-cyan/10 border border-neon-cyan/20 rounded-xl text-neon-cyan">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-neon-cyan/5 rounded-full blur-xl"></div>
        </GlassCard>

        {/* Van Stock Value */}
        <GlassCard glowColor="pink" className="p-6 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-2">
                {t('vanStockValue')}
              </span>
              <span className="text-3xl font-black text-white text-glow-pink">
                ${getVanStockValue().toLocaleString()}
              </span>
            </div>
            <div className="p-3 bg-neon-pink/10 border border-neon-pink/20 rounded-xl text-neon-pink">
              <Truck className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-neon-pink/5 rounded-full blur-xl"></div>
        </GlassCard>

        {/* Low Stock Alerts */}
        <GlassCard glowColor={getLowStockCount() > 0 ? 'amber' : 'none'} className="p-6 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-2">
                {t('lowStockAlerts')}
              </span>
              <span className={`text-3xl font-black text-white ${getLowStockCount() > 0 ? 'text-glow-amber' : ''}`}>
                {getLowStockCount()}
              </span>
            </div>
            <div className={`p-3 rounded-xl ${getLowStockCount() > 0 ? 'bg-neon-amber/10 border border-neon-amber/20 text-neon-amber animate-pulse' : 'bg-white/5 border border-white/10 text-text-muted'}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-neon-amber/5 rounded-full blur-xl"></div>
        </GlassCard>

      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Line Chart (Sales Trend) */}
        <GlassCard glowColor="cyan" className="p-6 lg:col-span-3 flex flex-col gap-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            {t('salesTrend')}
          </h3>
          <div className="w-full flex-1">
            <CustomChart type="line" data={getSalesTrendData()} color="cyan" height={220} />
          </div>
        </GlassCard>

        {/* Bar Chart (Top Products) */}
        <GlassCard glowColor="pink" className="p-6 lg:col-span-2 flex flex-col gap-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            {t('topProducts')}
          </h3>
          <div className="w-full flex-1">
            <CustomChart type="bar" data={getTopProductsData()} color="pink" />
          </div>
        </GlassCard>

      </div>

      {/* Bottom section: Low stock details table */}
      {lowStockProducts.length > 0 && (
        <GlassCard glowColor="amber" className="p-6">
          <div className="flex items-center gap-2 mb-4 text-neon-amber">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {t('lowStockAlerts')} - Warehouse Restock List
            </h3>
          </div>
          <div className="dense-table-container">
            <table className="dense-table">
              <thead>
                <tr>
                  <th>{t('sku')}</th>
                  <th>{t('productName')}</th>
                  <th>{t('category')}</th>
                  <th>{t('warehouseStock')}</th>
                  <th>{t('minStock')}</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.map(p => (
                  <tr key={p.id} className="border-l-2 border-l-neon-amber bg-neon-amber/5">
                    <td className="font-mono text-neon-amber font-semibold">{p.sku}</td>
                    <td>{p.nameEn}</td>
                    <td>{p.category}</td>
                    <td className="font-bold text-white">{p.warehouseStock}</td>
                    <td className="text-text-muted">{p.minStockAlert}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

    </div>
  );
};
