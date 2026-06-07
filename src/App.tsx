import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TranslationProvider, useTranslation } from './context/TranslationContext';
import { Login } from './views/shared/Login';

// Admin Views
import { AdminDashboard } from './views/admin/AdminDashboard';
import { InventoryManager } from './views/admin/InventoryManager';
import { StockTransfer } from './views/admin/StockTransfer';
import { SalesInvoices } from './views/admin/SalesInvoices';
import { ClientCRM } from './views/admin/ClientCRM';
import { FinanceClosing } from './views/admin/FinanceClosing';
import { ReportsView } from './views/admin/ReportsView';
import { UserManagement } from './views/admin/UserManagement';
import { AnalyticsDashboard } from './views/admin/AnalyticsDashboard';
import { ArchiveView } from './views/admin/ArchiveView';
import { Layout } from './components/Layout';

// Rep Views
import { RepDashboard } from './views/rep/RepDashboard';
import { RepPOS } from './views/rep/RepPOS';
import { RepCustodyCheck } from './views/rep/RepCustodyCheck';

import { 
  LayoutDashboard, 
  Package, 
  ArrowLeftRight, 
  FileText, 
  Users, 
  DollarSign, 
  BarChart3, 
  UserCog, 
  LogOut, 
  Globe, 
  Menu, 
  X,
  Database,
  ShoppingCart,
  Activity,
  Archive
} from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, logout, isFirebase } = useAuth();
  const { t, language, setLanguage, isRTL } = useTranslation();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) {
    return <Login />;
  }

  const isRep = user.role === 'rep';
  const isWarehouseManager = user.role === 'warehouse';

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  // --- 1. REPRESENTATIVE INTERFACE (RESPONSIVE) ---
  if (isRep) {
    const renderRepContent = () => {
      switch (activeTab) {
        case 'dashboard':
          return <RepDashboard onNavigate={(tab: string) => setActiveTab(tab)} />;
        case 'pos':
          return <RepPOS />;
        case 'custody':
          return <RepCustodyCheck />;
        default:
          return <RepDashboard onNavigate={(tab: string) => setActiveTab(tab)} />;
      }
    };

    return (
      <div className="admin-container flex h-screen bg-slate-950 overflow-hidden rep-responsive-container">
        
        {/* Sidebar - Desktop only (hidden on mobile via index.css) */}
        <aside className="sidebar flex flex-col rep-sidebar">
          {/* App Title */}
          <div className="sidebar-brand">
            <h1 className="text-xl font-black tracking-tight text-white text-glow-cyan uppercase">
              {t('appName')}
            </h1>
            <div className="text-[10px] text-text-muted mt-1 uppercase font-bold tracking-wider">
              {t('roleRep')}
            </div>
          </div>

          {/* Menu Items */}
          <nav className="sidebar-nav flex flex-col gap-1-5 custom-scrollbar">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-neon-cyan/15 border border-neon-cyan/30 text-neon-cyan text-glow-cyan font-bold'
                  : 'bg-transparent border border-transparent text-text-secondary hover:text-white hover:bg-white/5'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>{t('menuDashboard')}</span>
            </button>

            <button
              onClick={() => setActiveTab('pos')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'pos'
                  ? 'bg-neon-cyan/15 border border-neon-cyan/30 text-neon-cyan text-glow-cyan font-bold'
                  : 'bg-transparent border border-transparent text-text-secondary hover:text-white hover:bg-white/5'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>POS</span>
            </button>

            <button
              onClick={() => setActiveTab('custody')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'custody'
                  ? 'bg-neon-cyan/15 border border-neon-cyan/30 text-neon-cyan text-glow-cyan font-bold'
                  : 'bg-transparent border border-transparent text-text-secondary hover:text-white hover:bg-white/5'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>{t('vanInventoryList')}</span>
            </button>
          </nav>

          {/* Footer info & Logout */}
          <div className="sidebar-footer flex flex-col gap-3">
            <div className="flex items-center gap-2-5">
              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-white">
                {user.name.charAt(0)}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-white truncate">{user.name}</span>
                <span className="text-[10px] text-text-muted truncate">{user.email}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={toggleLanguage}
                className="flex-1 btn-secondary py-1.5 text-xs flex items-center justify-center gap-1"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{t('toggleLanguage')}</span>
              </button>
              <button
                onClick={logout}
                className="flex-1 btn-primary-pink py-1.5 text-xs flex items-center justify-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t('logout')}</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Panel Content Area */}
        <div className="main-panel flex flex-col">
          
          {/* Top Header bar - Desktop only */}
          <header className="header-bar rep-desktop-header justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs">
                <Database className={`w-3.5 h-3.5 ${isFirebase ? 'text-neon-green' : 'text-neon-cyan animate-pulse'}`} />
                <span className="text-text-secondary text-[11px] font-semibold">
                  {isFirebase ? t('connectingFirebase') : t('runningMockMode')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-xs text-text-secondary">
                {t('activeUser')}: <strong className="text-white">{user.name}</strong>
              </span>
            </div>
          </header>

          {/* Sticky Mobile Header - Mobile/Tablet only */}
          <header className="rep-header rep-mobile-header justify-between items-center">
            <span className="text-neon-cyan font-black tracking-tight text-sm uppercase">
              {t('appName')}
            </span>

            <div className="flex items-center gap-3">
              {/* DB Connection state */}
              <div className="flex items-center gap-1-5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px]">
                <Database className={`w-3 h-3 ${isFirebase ? 'text-neon-green' : 'text-neon-cyan animate-pulse'}`} />
                <span className="text-text-secondary">
                  {isFirebase ? 'Cloud' : 'Mock'}
                </span>
              </div>

              {/* Language toggle */}
              <button 
                onClick={toggleLanguage}
                className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white"
              >
                <Globe className="w-4 h-4 text-neon-pink" />
              </button>

              {/* Logout */}
              <button
                onClick={logout}
                className="p-1.5 rounded-lg bg-neon-pink/10 border border-neon-pink/20 text-neon-pink"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Content Body */}
          <main className="content-area rep-content custom-scrollbar">
            {renderRepContent()}
          </main>

          {/* Mobile bottom tab bar - Mobile/Tablet only */}
          <nav className="rep-navbar rep-mobile-navbar justify-around py-2">
            
            {/* Dashboard Tab */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center gap-1 py-1 px-3 ${
                activeTab === 'dashboard' ? 'text-neon-cyan' : 'text-text-muted hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-[9px] font-bold">{t('menuDashboard')}</span>
            </button>

            {/* POS Tab */}
            <button
              onClick={() => setActiveTab('pos')}
              className={`flex flex-col items-center gap-1 py-1 px-3 ${
                activeTab === 'pos' ? 'text-neon-cyan' : 'text-text-muted hover:text-white'
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="text-[9px] font-bold">POS</span>
            </button>

            {/* Custody check Tab */}
            <button
              onClick={() => setActiveTab('custody')}
              className={`flex flex-col items-center gap-1 py-1 px-3 ${
                activeTab === 'custody' ? 'text-neon-cyan' : 'text-text-muted hover:text-white'
              }`}
            >
              <Package className="w-5 h-5" />
              <span className="text-[9px] font-bold">Van Stock</span>
            </button>

          </nav>
        </div>

      </div>
    );
  }

  // --- 2. ADMIN/WAREHOUSE MANAGER INTERFACE (DESKTOP VIEW) ---
  
  // Define menu groups with RBAC permissions
  const menuGroups = [
    {
      id: 'general',
      labelEn: 'General',
      labelAr: 'العام والرئيسية',
      items: [
        { id: 'dashboard', label: t('menuDashboard'), icon: LayoutDashboard, role: ['admin', 'warehouse'] }
      ]
    },
    {
      id: 'sales_logistics',
      labelEn: 'Sales & Logistics',
      labelAr: 'المبيعات واللوجستيات',
      items: [
        { id: 'invoices', label: t('menuInvoices'), icon: FileText, role: ['admin', 'warehouse'] },
        { id: 'clients', label: t('menuClients'), icon: Users, role: ['admin', 'warehouse'] },
        { id: 'stockTransfer', label: t('menuStockTransfer'), icon: ArrowLeftRight, role: ['admin', 'warehouse'] }
      ]
    },
    {
      id: 'warehouse_inventory',
      labelEn: 'Warehouse',
      labelAr: 'المستودع والمخازن',
      items: [
        { id: 'inventory', label: t('menuInventory'), icon: Package, role: ['admin', 'warehouse'] }
      ]
    },
    {
      id: 'finance_analytics',
      labelEn: 'Finance & Analytics',
      labelAr: 'المالية والتحليلات',
      items: [
        { id: 'finance', label: t('menuFinance'), icon: DollarSign, role: ['admin'] },
        { id: 'reports', label: t('menuReports'), icon: BarChart3, role: ['admin', 'warehouse'] },
        { id: 'analytics', label: language === 'ar' ? 'التحليلات والمؤشرات' : 'Analytics & KPIs', icon: Activity, role: ['admin'] },
        { id: 'archive', label: language === 'ar' ? 'الأرشيف' : 'Archive', icon: Archive, role: ['admin', 'warehouse'] }
      ]
    },
    {
      id: 'system',
      labelEn: 'System Settings',
      labelAr: 'إعدادات النظام',
      items: [
        { id: 'users', label: t('menuUsers'), icon: UserCog, role: ['admin'] }
      ]
    }
  ];

  const filteredGroups = menuGroups.map(group => {
    const items = group.items.filter(item => item.role.includes(user.role));
    return { ...group, items };
  }).filter(group => group.items.length > 0);

  const renderAdminContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'inventory':
        return <InventoryManager />;
      case 'stockTransfer':
        return <StockTransfer />;
      case 'invoices':
        return <SalesInvoices />;
      case 'clients':
        return <ClientCRM />;
      case 'finance':
        if (isWarehouseManager) return <AdminDashboard />;
        return <FinanceClosing />;
      case 'reports':
        return <ReportsView />;
      case 'analytics':
        if (isWarehouseManager) return <AdminDashboard />;
        return <AnalyticsDashboard />;
      case 'archive':
        return <ArchiveView />;
      case 'users':
        if (isWarehouseManager) return <AdminDashboard />;
        return <UserManagement />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      menuGroups={filteredGroups}
      user={{
        name: user.name,
        email: user.email,
        role: user.role
      }}
      logout={logout}
      isFirebase={isFirebase}
      t={t}
      language={language}
      toggleLanguage={toggleLanguage}
    >
      {renderAdminContent()}
    </Layout>
  );
};

function App() {
  return (
    <TranslationProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </TranslationProvider>
  );
}

export default App;
