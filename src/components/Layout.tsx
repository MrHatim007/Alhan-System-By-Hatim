import React, { useState } from 'react';
import { Menu, X, Database, Globe, LogOut, ChevronRight, ChevronLeft } from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
}

interface MenuGroup {
  id: string;
  labelEn: string;
  labelAr: string;
  items: MenuItem[];
}

interface User {
  name: string;
  email: string;
  role: string;
}

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  menuGroups: MenuGroup[];
  user: User;
  logout: () => void;
  isFirebase: boolean;
  t: (key: string) => string;
  language: string;
  toggleLanguage: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  activeTab,
  setActiveTab,
  menuGroups,
  user,
  logout,
  isFirebase,
  t,
  language,
  toggleLanguage
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isRTL = language === 'ar';

  return (
    <div className="admin-container flex h-screen w-screen overflow-hidden bg-obsidian-main text-text-primary">
      
      {/* 1. FIXED DESKTOP SIDEBAR (256px wide, locked height, LTR/RTL mirror border) */}
      <aside className={`sidebar hidden lg:flex flex-col w-[256px] h-full bg-obsidian-surfaceOpaque flex-shrink-0 transition-all duration-300 ${
        isRTL ? 'border-l border-white/5' : 'border-r border-white/5'
      }`}>
        
        {/* Branding header (Hatim Finance identity) */}
        <div className="sidebar-brand p-6 border-b border-white/5 flex flex-col gap-1">
          <h1 className="text-xl font-black tracking-tight text-white text-glow-cyan uppercase select-none">
            {t('appName')}
          </h1>
          <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider select-none">
            {t(`role${user.role.charAt(0).toUpperCase() + user.role.slice(1)}`)}
          </span>
        </div>

        {/* Grouped Sidebar Items */}
        <nav className="sidebar-nav flex-1 p-4 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
          {menuGroups.map(group => (
            <div key={group.id} className="flex flex-col gap-2">
              <span className={`text-[10px] text-text-muted font-black tracking-wider uppercase px-4 select-none ${
                isRTL ? 'text-right' : 'text-left'
              }`}>
                {language === 'ar' ? group.labelAr : group.labelEn}
              </span>
              <div className="flex flex-col gap-1">
                {group.items.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 select-none ${
                        isRTL ? 'flex-row' : 'flex-row'
                      } ${
                        isActive 
                          ? 'bg-neon-cyan/15 border border-neon-cyan/30 text-neon-cyan text-glow-cyan font-bold shadow-neon-cyan' 
                          : 'bg-transparent border border-transparent text-text-secondary hover:text-white hover:bg-white/5 hover:translate-x-1'
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer with Profile Card & Controls */}
        <div className="sidebar-footer p-4 border-t border-white/5 bg-black/20 flex flex-col gap-4">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5">
            <div className="w-8 h-8 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center text-xs font-bold text-neon-cyan">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-white truncate">{user.name}</span>
              <span className="text-[10px] text-text-muted truncate">{user.email}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={toggleLanguage}
              className="flex-1 btn-secondary py-2 text-xs flex items-center justify-center gap-1.5 min-h-[36px]"
              title={t('toggleLanguage')}
            >
              <Globe className="w-4 h-4 flex-shrink-0 text-neon-pink" />
              <span className="font-semibold">{t('toggleLanguage')}</span>
            </button>
            <button
              onClick={logout}
              className="flex-1 btn-primary-pink py-2 text-xs flex items-center justify-center gap-1.5 min-h-[36px]"
              title={t('logout')}
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              <span className="font-semibold">{t('logout')}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <div className="main-panel flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        
        {/* Laptop Header Bar (locked height at 64px) */}
        <header className="header-bar w-full h-[64px] bg-obsidian-surfaceOpaque border-b border-white/5 px-6 flex items-center justify-between flex-shrink-0">
          
          <div className="flex items-center gap-3">
            {/* Hamburger drawer trigger (mobile viewport) */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            {/* Database indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-xs select-none">
              <Database className={`w-3.5 h-3.5 ${isFirebase ? 'text-neon-green' : 'text-neon-cyan animate-pulse'}`} />
              <span className="text-text-secondary text-[11px] font-semibold">
                {isFirebase ? t('connectingFirebase') : t('runningMockMode')}
              </span>
            </div>
          </div>

          {/* User profile card indicator */}
          <div className="hidden lg:flex items-center gap-2">
            <span className="text-xs text-text-secondary select-none">
              {t('activeUser')}: <strong className="text-white font-semibold">{user.name}</strong>
            </span>
          </div>
        </header>

        {/* Scrollable Viewport Canvas Container (utilizes factors of 8px grid system) */}
        <main className="content-area flex-grow p-6 overflow-y-auto custom-scrollbar bg-obsidian-main">
          <div className="w-full h-full max-w-[1600px] mx-auto flex flex-col gap-6">
            {children}
          </div>
        </main>
      </div>

      {/* 3. MOBILE MENU DRAWER OVERLAY */}
      {mobileMenuOpen && (
        <div 
          className="mobile-drawer-overlay fixed inset-0 z-50 flex bg-black/80 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div 
            className={`mobile-drawer-content w-[256px] h-full bg-obsidian-surfaceOpaque p-6 flex flex-col relative transition-transform duration-300 ${
              isRTL ? 'mr-auto' : 'ml-auto'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full min-w-[40px] min-h-[40px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Title */}
            <div className="mt-2 mb-6 flex flex-col gap-1">
              <h1 className="text-lg font-black tracking-tight text-glow-cyan text-white uppercase">
                {t('appName')}
              </h1>
              <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider">
                {t(`role${user.role.charAt(0).toUpperCase() + user.role.slice(1)}`)}
              </span>
            </div>

            {/* Navigation links */}
            <nav className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
              {menuGroups.map(group => (
                <div key={group.id} className="flex flex-col gap-2">
                  <span className="text-[10px] text-text-muted font-black tracking-wider uppercase px-4 border-b border-white/5 pb-1 select-none">
                    {language === 'ar' ? group.labelAr : group.labelEn}
                  </span>
                  <div className="flex flex-col gap-1">
                    {group.items.map(item => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab(item.id);
                            setMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                            isActive 
                              ? 'bg-neon-cyan/15 border border-neon-cyan/25 text-neon-cyan font-bold shadow-neon-cyan' 
                              : 'bg-transparent text-text-secondary hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* Footer actions */}
            <div className="border-t border-white/5 pt-4 flex flex-col gap-3">
              <button
                onClick={toggleLanguage}
                className="w-full btn-secondary py-2.5 text-xs flex items-center justify-center gap-1.5 min-h-[40px]"
              >
                <Globe className="w-4 h-4 text-neon-pink flex-shrink-0" />
                <span className="font-semibold">{t('toggleLanguage')}</span>
              </button>
              <button
                onClick={logout}
                className="w-full btn-primary-pink py-2.5 text-xs flex items-center justify-center gap-1.5 min-h-[40px]"
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                <span className="font-semibold">{t('logout')}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
