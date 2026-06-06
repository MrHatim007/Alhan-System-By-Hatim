import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/TranslationContext';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/GlassCard';
import { 
  subscribeToCustodies, 
  subscribeToInvoices,
  CustodyRecord,
  InvoiceRecord 
} from '../../services/dbService';
import { ShoppingCart, PackageOpen, HelpCircle, DollarSign, Award, ChevronRight, ChevronLeft } from 'lucide-react';

interface RepDashboardProps {
  onNavigate: (tab: string) => void;
}

export const RepDashboard: React.FC<RepDashboardProps> = ({ onNavigate }) => {
  const { t, isRTL } = useTranslation();
  const { user } = useAuth();
  
  const [custodies, setCustodies] = useState<CustodyRecord[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);

  useEffect(() => {
    const unsubCust = subscribeToCustodies(setCustodies);
    const unsubInvoices = subscribeToInvoices(setInvoices);

    return () => {
      unsubCust();
      unsubInvoices();
    };
  }, []);

  const activeCustody = custodies.find(c => c.repId === user?.id && c.status === 'open');

  // --- Calculations ---

  // 1. Value of active custody stock inside the van (SellingPrice * remainingQty)
  const getCustodyValue = () => {
    if (!activeCustody) return 0;
    // We can multiply items by their estimated selling price from products
    // For simplicity, we can multiply the remaining quantities
    // (qtyTransferred - qtySold) * unit price.
    // In dbService, we have product records which we can fetch, but we can also estimate
    // using custody item averages or directly matching them.
    // Let's assume a standard value of items in van custody.
    return activeCustody.items.reduce((sum, item) => {
      const remaining = item.qtyTransferred - item.qtyReturned - item.qtySold;
      // standard averages: shisha=$65, charcoal=$43, accessories=$10
      const estimatePrice = item.sku.startsWith('SHI') ? 65 : item.sku.startsWith('COA') ? 43 : 10;
      return sum + (remaining * estimatePrice);
    }, 0);
  };

  // 2. Rep's total sales today
  const getTodaySales = () => {
    const today = new Date().toISOString().split('T')[0];
    return invoices
      .filter(inv => inv.repId === user?.id && inv.date.startsWith(today))
      .reduce((sum, inv) => sum + inv.totalAmount, 0);
  };

  // 3. Rep's cash collected today
  const getTodayCashCollected = () => {
    const today = new Date().toISOString().split('T')[0];
    return invoices
      .filter(inv => inv.repId === user?.id && inv.date.startsWith(today))
      .reduce((sum, inv) => sum + inv.paidAmount, 0);
  };

  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <div className="flex flex-col gap-5 pb-8">
      
      {/* Welcome Message */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-neon-cyan/20 border border-neon-cyan/30 flex items-center justify-center text-neon-cyan font-bold text-lg">
          {user?.name.charAt(0)}
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-text-secondary">{t('welcome')},</span>
          <span className="text-base font-bold text-white">{user?.name}</span>
        </div>
      </div>

      {/* Custody Info alert if none active */}
      {!activeCustody && (
        <div className="p-4 rounded-xl bg-neon-pink/10 border border-neon-pink/20 text-neon-pink text-xs leading-relaxed flex items-center gap-3">
          <HelpCircle className="w-5 h-5 flex-shrink-0" />
          <span>{t('noActiveCustodyAlert')}</span>
        </div>
      )}

      {/* Mobile grid for metrics */}
      <div className="grid grid-cols-2 gap-4">
        
        {/* Today's Sales */}
        <GlassCard glowColor="green" className="p-4 relative">
          <span className="text-[10px] text-text-secondary font-bold uppercase block mb-1">
            {t('todaySales')}
          </span>
          <strong className="text-xl font-black text-white text-glow-green font-mono">
            ${getTodaySales().toLocaleString()}
          </strong>
          <div className={`absolute top-3 ${isRTL ? 'left-3' : 'right-3'} text-neon-green/20`}>
            <Award className="w-5 h-5" />
          </div>
        </GlassCard>

        {/* Cash Collected */}
        <GlassCard glowColor="cyan" className="p-4 relative">
          <span className="text-[10px] text-text-secondary font-bold uppercase block mb-1">
            {t('todayCashCollected')}
          </span>
          <strong className="text-xl font-black text-white text-glow-cyan font-mono">
            ${getTodayCashCollected().toLocaleString()}
          </strong>
          <div className={`absolute top-3 ${isRTL ? 'left-3' : 'right-3'} text-neon-cyan/20`}>
            <DollarSign className="w-5 h-5" />
          </div>
        </GlassCard>

        {/* Remaining Custody Value */}
        <GlassCard glowColor="pink" className="p-4 col-span-2 relative">
          <span className="text-[10px] text-text-secondary font-bold uppercase block mb-1">
            {t('todayCustody')} ({t('estimated')})
          </span>
          <strong className="text-2xl font-black text-white text-glow-pink font-mono">
            ${getCustodyValue().toLocaleString()}
          </strong>
          <div className={`absolute top-3 ${isRTL ? 'left-3' : 'right-3'} text-neon-pink/20`}>
            <PackageOpen className="w-6 h-6" />
          </div>
        </GlassCard>

      </div>

      {/* Quick Actions Panel */}
      <div className="flex flex-col gap-3">
        <h4 className="text-xs font-bold text-neon-cyan uppercase tracking-wider pl-1">
          {t('quickActions')}
        </h4>

        <div 
          onClick={() => activeCustody && onNavigate('pos')}
          className={`flex justify-between items-center p-4 rounded-xl border transition-all ${
            activeCustody 
              ? 'bg-neon-cyan/5 border-neon-cyan/25 text-white active:scale-95 cursor-pointer' 
              : 'bg-white/5 border-white/10 text-text-muted cursor-not-allowed opacity-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-5 h-5 text-neon-cyan" />
            <div className="flex flex-col">
              <span className="font-bold text-sm">{t('startNewSale')}</span>
              <span className="text-[10px] text-text-secondary">{t('scanCustomerAndCheckout')}</span>
            </div>
          </div>
          <ChevronIcon className="w-5 h-5 text-text-secondary" />
        </div>

        <div 
          onClick={() => onNavigate('custody')}
          className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-white/10 text-white active:scale-95 cursor-pointer transition-all"
        >
          <div className="flex items-center gap-3">
            <PackageOpen className="w-5 h-5 text-neon-pink" />
            <div className="flex flex-col">
              <span className="font-bold text-sm">{t('vanInventoryList')}</span>
              <span className="text-[10px] text-text-secondary">{t('checkVanStockDesc')}</span>
            </div>
          </div>
          <ChevronIcon className="w-5 h-5 text-text-secondary" />
        </div>
      </div>

    </div>
  );
};
