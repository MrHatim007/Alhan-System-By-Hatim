import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/TranslationContext';
import { GlassCard } from '../../components/GlassCard';
import { CustomChart } from '../../components/CustomChart';
import { 
  subscribeToInvoices, 
  subscribeToExpenses, 
  subscribeToCustodies, 
  subscribeToProducts,
  subscribeToClients,
  InvoiceRecord,
  ExpenseRecord,
  CustodyRecord,
  ProductRecord,
  ClientRecord
} from '../../services/dbService';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Percent, 
  AlertTriangle, 
  TrendingDown, 
  Truck, 
  Activity, 
  ArrowUpRight,
  MapPin,
  Calendar,
  Sparkles
} from 'lucide-react';

export const AnalyticsDashboard: React.FC = () => {
  const { t, language } = useTranslation();
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [custodies, setCustodies] = useState<CustodyRecord[]>([]);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [clients, setClients] = useState<ClientRecord[]>([]);

  useEffect(() => {
    const unsubInvoices = subscribeToInvoices(setInvoices);
    const unsubExpenses = subscribeToExpenses(setExpenses);
    const unsubCustodies = subscribeToCustodies(setCustodies);
    const unsubProducts = subscribeToProducts(setProducts);
    const unsubClients = subscribeToClients(setClients);

    return () => {
      unsubInvoices();
      unsubExpenses();
      unsubCustodies();
      unsubProducts();
      unsubClients();
    };
  }, []);

  // --- Calculations & KPI Derivations ---

  // 1. Financial totals
  const totalSales = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
  const totalDue = invoices.reduce((sum, inv) => sum + inv.debtAmount, 0);
  
  const totalCOGS = invoices.reduce((sum, inv) => {
    return sum + inv.items.reduce((iSum, item) => iSum + (item.quantity * (item.costPrice || 0)), 0);
  }, 0);

  const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const grossProfit = totalSales - totalCOGS;
  const netProfit = grossProfit - totalExpense;
  const profitMargin = totalSales > 0 ? Math.round((netProfit / totalSales) * 100) : 0;

  // Outstanding Debt in market (from Clients CRM)
  const outstandingMarketDebt = clients.reduce((sum, c) => sum + c.outstandingDebt, 0);
  const totalCreditLimit = clients.reduce((sum, c) => sum + c.creditLimit, 0);
  const creditUtilization = totalCreditLimit > 0 ? Math.round((outstandingMarketDebt / totalCreditLimit) * 100) : 0;

  // Active Custodies stock value
  const totalVanStockValue = custodies
    .filter(c => c.status === 'open')
    .reduce((sum, c) => {
      return sum + c.items.reduce((iSum, item) => {
        const remaining = item.qtyTransferred - item.qtySold - item.qtyReturned;
        // Estimate selling value
        const price = item.sku.startsWith('SHI') ? 65 : item.sku.startsWith('COA') ? 43 : 10;
        return iSum + (remaining * price);
      }, 0);
    }, 0);

  // Discrepancies counting
  let totalDiscrepancyUnits = 0;
  let totalDiscrepancyValue = 0;
  custodies.forEach(c => {
    if (c.status === 'closed') {
      c.items.forEach(item => {
        if (item.qtyDiscrepancy !== 0) {
          totalDiscrepancyUnits += Math.abs(item.qtyDiscrepancy);
          const price = item.sku.startsWith('SHI') ? 65 : item.sku.startsWith('COA') ? 43 : 10;
          totalDiscrepancyValue += Math.abs(item.qtyDiscrepancy) * price;
        }
      });
    }
  });

  const discrepancyRate = totalSales > 0 ? ((totalDiscrepancyValue / totalSales) * 100).toFixed(1) : '0.0';

  // 2. Sales Trend (group by invoice date)
  const getSalesTrendData = () => {
    const dailyMap: Record<string, number> = {};
    
    // Sort invoices by date
    const sortedInvoices = [...invoices].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    sortedInvoices.forEach(inv => {
      const dateStr = new Date(inv.date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
        month: 'short',
        day: 'numeric'
      });
      dailyMap[dateStr] = (dailyMap[dateStr] || 0) + inv.totalAmount;
    });

    const entries = Object.entries(dailyMap);
    if (entries.length === 0) {
      return [{ label: 'Today', value: 0 }];
    }
    // Return last 6 data points
    return entries.slice(-6).map(([label, value]) => ({ label, value }));
  };

  const salesTrend = getSalesTrendData();

  // 3. Category Sales Share
  const getCategorySalesData = () => {
    let shishaSales = 0;
    let charcoalSales = 0;
    let otherSales = 0;

    invoices.forEach(inv => {
      inv.items.forEach(item => {
        if (item.productId.includes('shi') || item.nameEn.toLowerCase().includes('shisha') || item.nameAr.includes('معسل')) {
          shishaSales += item.total;
        } else if (item.productId.includes('coa') || item.nameEn.toLowerCase().includes('charcoal') || item.nameAr.includes('فحم')) {
          charcoalSales += item.total;
        } else {
          otherSales += item.total;
        }
      });
    });

    const total = shishaSales + charcoalSales + otherSales;
    return [
      { label: language === 'ar' ? 'معسل الشيشة' : 'Shisha Flavors', value: shishaSales, percent: total > 0 ? Math.round((shishaSales / total) * 100) : 0 },
      { label: language === 'ar' ? 'فحم طبيعي' : 'Natural Charcoal', value: charcoalSales, percent: total > 0 ? Math.round((charcoalSales / total) * 100) : 0 },
      { label: language === 'ar' ? 'مستلزمات وأخرى' : 'Accessories & Other', value: otherSales, percent: total > 0 ? Math.round((otherSales / total) * 100) : 0 }
    ];
  };

  const categoryShare = getCategorySalesData();

  // 4. Mandoob Leaderboard
  const getRepsLeaderboard = () => {
    const reps: Record<string, { 
      name: string; 
      sales: number; 
      invoices: number; 
      cash: number; 
      variance: number;
      active: boolean 
    }> = {};

    invoices.forEach(inv => {
      if (inv.repId === 'warehouse') return;
      if (!reps[inv.repId]) {
        reps[inv.repId] = { name: inv.repName, sales: 0, invoices: 0, cash: 0, variance: 0, active: false };
      }
      reps[inv.repId].sales += inv.totalAmount;
      reps[inv.repId].invoices += 1;
      reps[inv.repId].cash += inv.paidAmount;
    });

    custodies.forEach(c => {
      if (c.status === 'open' && reps[c.repId]) {
        reps[c.repId].active = true;
      }
      if (c.status === 'closed' && reps[c.repId]) {
        const discrepancyValue = c.items.reduce((sum, item) => {
          const price = item.sku.startsWith('SHI') ? 65 : item.sku.startsWith('COA') ? 43 : 10;
          return sum + (Math.abs(item.qtyDiscrepancy) * price);
        }, 0);
        reps[c.repId].variance += discrepancyValue;
      }
    });

    return Object.values(reps).sort((a, b) => b.sales - a.sales);
  };

  const repsLeaderboard = getRepsLeaderboard();

  // 5. High-Value Clients CRM Analytics
  const getClientAnalytics = () => {
    return clients
      .map(c => {
        // Find total sales volume for this client
        const clientSales = invoices
          .filter(inv => inv.clientId === c.id)
          .reduce((sum, inv) => sum + inv.totalAmount, 0);

        return {
          ...c,
          totalSales: clientSales
        };
      })
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 5); // top 5
  };

  const topClients = getClientAnalytics();

  return (
    <div className="flex flex-col gap-6 pb-12">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
            <Activity className="w-5 h-5 text-neon-cyan animate-pulse" />
            {language === 'ar' ? 'مركز التحليلات والمؤشرات الشاملة' : 'Deep Analytics & KPI Dashboard'}
          </h2>
          <p className="text-text-secondary text-sm">
            {language === 'ar' 
              ? 'مراقبة فورية لأداء المندوبين، التدفق المالي، توزيع عهد السيارات ومعدلات العجز والجرد.' 
              : 'Real-time performance audit, cash flow, active van distributions, inventory variances.'}
          </p>
        </div>
        
        {/* Date Filter Display Badge */}
        <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2 text-xs text-text-secondary w-fit">
          <Calendar className="w-4 h-4 text-neon-pink" />
          <span>{language === 'ar' ? 'مزامنة حية ونشطة' : 'Live & Synchronized'}</span>
          <span className="w-2 h-2 rounded-full bg-neon-green animate-ping ml-1"></span>
        </div>
      </div>

      {/* 4 Core KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Gross Sales */}
        <GlassCard glowColor="green" className="p-5 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-text-secondary text-xs font-bold uppercase tracking-wider">
                {language === 'ar' ? 'إجمالي المبيعات' : 'Gross Sales'}
              </span>
              <strong className="text-3xl font-black text-white text-glow-green font-mono mt-2">${totalSales}</strong>
            </div>
            <div className="p-2.5 rounded-xl bg-neon-green/10 border border-neon-green/20 text-neon-green">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-4 text-[11px]">
            <span className="text-neon-green flex items-center font-bold">
              <ArrowUpRight className="w-3.5 h-3.5" />
              100%
            </span>
            <span className="text-text-muted">
              {language === 'ar' ? 'الإيرادات التشغيلية الكلية' : 'Total operating revenue'}
            </span>
          </div>
          <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-neon-green/5 rounded-full blur-xl group-hover:scale-150 transition-all duration-500"></div>
        </GlassCard>

        {/* Card 2: Net Profit Margin */}
        <GlassCard glowColor="cyan" className="p-5 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-text-secondary text-xs font-bold uppercase tracking-wider">
                {language === 'ar' ? 'صافي الأرباح' : 'Net Operating Profit'}
              </span>
              <strong className="text-3xl font-black text-white text-glow-cyan font-mono mt-2">${netProfit}</strong>
            </div>
            <div className="p-2.5 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-4 text-[11px]">
            <span className="text-neon-cyan flex items-center font-bold">
              <Percent className="w-3 h-3" />
              {profitMargin}%
            </span>
            <span className="text-text-muted">
              {language === 'ar' ? 'هامش صافي ربح البضائع' : 'Net sales profit margin'}
            </span>
          </div>
          <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-neon-cyan/5 rounded-full blur-xl group-hover:scale-150 transition-all duration-500"></div>
        </GlassCard>

        {/* Card 3: Market Debt & Limit */}
        <GlassCard glowColor="pink" className="p-5 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-text-secondary text-xs font-bold uppercase tracking-wider">
                {language === 'ar' ? 'الديون المستحقة في السوق' : 'Market Credit Exposure'}
              </span>
              <strong className="text-3xl font-black text-white text-glow-pink font-mono mt-2">${outstandingMarketDebt}</strong>
            </div>
            <div className="p-2.5 rounded-xl bg-neon-pink/10 border border-neon-pink/20 text-neon-pink">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-4 text-[11px]">
            <span className="text-neon-pink flex items-center font-bold">
              {creditUtilization}%
            </span>
            <span className="text-text-muted">
              {language === 'ar' ? 'معدل استهلاك السقف الائتماني' : 'Limit capacity utilized'}
            </span>
          </div>
          <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-neon-pink/5 rounded-full blur-xl group-hover:scale-150 transition-all duration-500"></div>
        </GlassCard>

        {/* Card 4: Van Stock & Discrepancies */}
        <GlassCard glowColor="amber" className="p-5 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-text-secondary text-xs font-bold uppercase tracking-wider">
                {language === 'ar' ? 'بضائع السيارات وعجز الجرد' : 'Road Value & Discrepancy'}
              </span>
              <strong className="text-3xl font-black text-white text-glow-amber font-mono mt-2">${totalVanStockValue}</strong>
            </div>
            <div className="p-2.5 rounded-xl bg-neon-amber/10 border border-neon-amber/20 text-neon-amber">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-4 text-[11px]">
            <span className="text-neon-pink flex items-center gap-0.5 font-bold">
              <AlertTriangle className="w-3.5 h-3.5" />
              {discrepancyRate}% {language === 'ar' ? 'عجز' : 'loss'}
            </span>
            <span className="text-text-muted">
              {language === 'ar' ? 'تآكل المبيعات بسبب الفوارق' : 'Revenue loss rate'}
            </span>
          </div>
          <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-neon-amber/5 rounded-full blur-xl group-hover:scale-150 transition-all duration-500"></div>
        </GlassCard>

      </div>

      {/* Main Graph & Category Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Sales trend line chart */}
        <GlassCard className="lg:col-span-2 p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-slate-900 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {language === 'ar' ? 'مخطط اتجاه المبيعات اليومي ($)' : 'Daily Sales Trend ($)'}
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-neon-cyan/15 text-neon-cyan font-bold font-mono">Line Graph</span>
          </div>
          <div className="pt-2">
            <CustomChart type="line" data={salesTrend} color="cyan" height={220} />
          </div>
        </GlassCard>

        {/* Right Column: Share by Product Categories */}
        <GlassCard className="p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-slate-900 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {language === 'ar' ? 'حصة مبيعات الأقسام' : 'Sales share by Category'}
            </h3>
            <Sparkles className="w-4 h-4 text-neon-cyan" />
          </div>
          
          <div className="flex flex-col gap-4 pt-3">
            {categoryShare.map((cat, idx) => (
              <div key={idx} className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-white font-medium">{cat.label}</span>
                  <span className="text-text-secondary font-mono">${cat.value} ({cat.percent}%)</span>
                </div>
                <div className="w-full h-2 rounded bg-slate-900 overflow-hidden">
                  <div 
                    className="h-full rounded transition-all duration-500" 
                    style={{ 
                      width: `${cat.percent}%`,
                      backgroundColor: idx === 0 ? '#00f2fe' : idx === 1 ? '#00ff87' : '#ff007f'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-3.5 bg-slate-900/60 border border-slate-850 rounded-xl text-[11px] text-text-secondary mt-auto">
            {language === 'ar' 
              ? 'تنويه: يستحوذ قسم المعسل والفحم على الحصة الأكبر من المبيعات لعملاء المقاهي وتوزيع الموزعين.'
              : 'Notice: Shisha and Charcoal represent the majority of van distributions, driving cafe invoicing.'}
          </div>
        </GlassCard>

      </div>

      {/* Leaderboards & CRM details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Mandoob Performance */}
        <GlassCard className="p-6">
          <div className="flex justify-between items-center border-b border-slate-900 pb-4 mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {language === 'ar' ? 'ترتيب المندوبين ومراقبة العجز' : 'Mandoob leaderboard & variance'}
            </h3>
            <Truck className="w-4 h-4 text-neon-cyan" />
          </div>

          <div className="flex flex-col gap-3.5 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
            {repsLeaderboard.length === 0 ? (
              <div className="text-center text-text-muted py-6 text-xs">{t('noData')}</div>
            ) : (
              repsLeaderboard.map((rep, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-neon-cyan/20 border border-neon-cyan/30 text-neon-cyan flex items-center justify-center font-bold font-mono">
                      {idx + 1}
                    </span>
                    <div className="flex flex-col">
                      <span className="font-semibold text-white">{rep.name}</span>
                      <span className="text-[10px] text-text-muted">
                        {rep.invoices} {language === 'ar' ? 'فواتير صادرة' : 'invoices logged'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex flex-col text-right">
                      <span className="font-bold text-neon-green font-mono">${rep.sales}</span>
                      <span className="text-[10px] text-text-muted">{language === 'ar' ? 'مبيعات الكاش' : 'Cash Collected'}</span>
                    </div>
                    
                    <div className="flex flex-col text-right min-w-[70px]">
                      <span className={`font-bold font-mono ${rep.variance > 0 ? 'text-neon-pink text-glow-pink' : 'text-text-muted'}`}>
                        ${rep.variance}
                      </span>
                      <span className="text-[10px] text-text-muted">{language === 'ar' ? 'العجز الإجمالي' : 'Variance Loss'}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>

        {/* Right Column: Top Cafes & Limits */}
        <GlassCard className="p-6">
          <div className="flex justify-between items-center border-b border-slate-900 pb-4 mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {language === 'ar' ? 'العملاء الأكثر شراءً وحجم المديونية' : 'Top Clients & outstanding debts'}
            </h3>
            <Users className="w-4 h-4 text-neon-pink" />
          </div>

          <div className="flex flex-col gap-3.5 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
            {topClients.length === 0 ? (
              <div className="text-center text-text-muted py-6 text-xs">{t('noData')}</div>
            ) : (
              topClients.map((client, idx) => {
                const limitUsagePct = client.creditLimit > 0 ? Math.round((client.outstandingDebt / client.creditLimit) * 100) : 0;
                return (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all text-xs">
                    <div className="flex flex-col max-w-[180px]">
                      <span className="font-semibold text-white truncate">
                        {language === 'ar' ? client.nameAr : client.nameEn}
                      </span>
                      <span className="text-[10px] text-text-muted truncate">
                        {language === 'ar' ? 'مشتريات كلية' : 'Total volume'}: <strong className="text-white font-mono">${client.totalSales}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-6">
                      {/* Limit bar indicator */}
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] text-text-secondary">
                          {language === 'ar' ? 'الآجل' : 'Debt'}: <strong className="text-neon-pink font-mono">${client.outstandingDebt}</strong>
                        </span>
                        <div className="w-20 h-1.5 rounded bg-slate-900 overflow-hidden">
                          <div 
                            className={`h-full rounded ${limitUsagePct > 85 ? 'bg-neon-pink' : 'bg-neon-cyan'}`}
                            style={{ width: `${Math.min(100, limitUsagePct)}%` }}
                          />
                        </div>
                      </div>
                      
                      <div className="flex flex-col text-right min-w-[60px]">
                        <span className="font-bold text-white font-mono">${client.creditLimit}</span>
                        <span className="text-[10px] text-text-muted">{t('creditLimit')}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </GlassCard>

      </div>

    </div>
  );
};
