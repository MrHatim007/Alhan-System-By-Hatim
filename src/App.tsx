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
  ShoppingCart
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

  // --- 1. REPRESENTATIVE INTERFACE (MOBILE-FIRST) ---
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
      <div className="rep-container flex flex-col min-h-screen bg-slate-950 pb-16">
        
        {/* Mobile Header */}
        <header className="rep-header flex justify-between items-center">
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

        {/* Mobile main body */}
        <main className="rep-content flex-1 p-4 overflow-y-auto">
          {renderRepContent()}
        </main>

        {/* Mobile bottom tab bar */}
        <nav className="rep-navbar flex justify-around py-2">
          
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
    );
  }

  // --- 2. ADMIN/WAREHOUSE MANAGER INTERFACE (DESKTOP VIEW) ---
  
  // Define menu items with RBAC permissions
  const menuItems = [
    { id: 'dashboard', label: t('menuDashboard'), icon: LayoutDashboard, role: ['admin', 'warehouse'] },
    { id: 'inventory', label: t('menuInventory'), icon: Package, role: ['admin', 'warehouse'] },
    { id: 'stockTransfer', label: t('menuStockTransfer'), icon: ArrowLeftRight, role: ['admin', 'warehouse'] },
    { id: 'invoices', label: t('menuInvoices'), icon: FileText, role: ['admin', 'warehouse'] },
    { id: 'clients', label: t('menuClients'), icon: Users, role: ['admin', 'warehouse'] },
    { id: 'finance', label: t('menuFinance'), icon: DollarSign, role: ['admin'] }, // Admins only
    { id: 'reports', label: t('menuReports'), icon: BarChart3, role: ['admin', 'warehouse'] },
    { id: 'users', label: t('menuUsers'), icon: UserCog, role: ['admin'] } // Admins only
  ];

  const allowedMenuItems = menuItems.filter(item => item.role.includes(user.role));

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
      case 'users':
        if (isWarehouseManager) return <AdminDashboard />;
        return <UserManagement />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="admin-container flex h-screen bg-slate-950 overflow-hidden">
      
      {/* Sidebar - Desktop */}
      <aside className="sidebar flex flex-col">
        {/* App Title */}
        <div className="sidebar-brand">
          <h1 className="text-xl font-black tracking-tight text-white text-glow-cyan uppercase">
            {t('appName')}
          </h1>
          <div className="text-[10px] text-text-muted mt-1 uppercase font-bold tracking-wider">
            {t(`role${user.role.charAt(0).toUpperCase() + user.role.slice(1)}`)}
          </div>
        </div>

        {/* Menu Items */}
        <nav className="sidebar-nav flex flex-col gap-1-5 custom-scrollbar">
          {allowedMenuItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive 
                    ? 'bg-neon-cyan/15 border border-neon-cyan/30 text-neon-cyan text-glow-cyan font-bold' 
                    : 'bg-transparent border border-transparent text-text-secondary hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
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
        
        {/* Top Header bar */}
        <header className="header-bar flex justify-between items-center">
          
          <div className="flex items-center gap-3">
            {/* Hamburger menu for Mobile/Tablet views */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="hamburger-btn p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            {/* Database indicator */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs">
              <Database className={`w-3.5 h-3.5 ${isFirebase ? 'text-neon-green' : 'text-neon-cyan animate-pulse'}`} />
              <span className="text-text-secondary text-[11px] font-semibold">
                {isFirebase ? t('connectingFirebase') : t('runningMockMode')}
              </span>
            </div>
          </div>

          {/* Active User display */}
          <div className="flex items-center gap-4">
            <span className="text-xs text-text-secondary">
              {t('activeUser')}: <strong className="text-white">{user.name}</strong>
            </span>
          </div>
        </header>

        {/* Content Body */}
        <main className="content-area custom-scrollbar">
          {renderAdminContent()}
        </main>
      </div>

      {/* Mobile Drawer Menu Navigation */}
      {mobileMenuOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-drawer-content flex flex-col" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <h1 className="text-lg font-black tracking-tight text-white mb-6 mt-2 text-glow-cyan uppercase">
              {t('appName')}
            </h1>

            <nav className="flex-1 flex flex-col gap-1-5 overflow-y-auto">
              {allowedMenuItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                      isActive 
                        ? 'bg-neon-cyan/15 border border-neon-cyan/25 text-neon-cyan font-bold' 
                        : 'bg-transparent text-text-secondary hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="border-t border-white/5 pt-4 flex flex-col gap-3">
              <button
                onClick={toggleLanguage}
                className="w-full btn-secondary py-2 text-xs flex items-center justify-center gap-1-5"
              >
                <Globe className="w-4 h-4 text-neon-pink" />
                <span>{t('toggleLanguage')}</span>
              </button>
              <button
                onClick={logout}
                className="w-full btn-primary-pink py-2 text-xs flex items-center justify-center gap-1-5"
              >
                <LogOut className="w-4 h-4" />
                <span>{t('logout')}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
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
