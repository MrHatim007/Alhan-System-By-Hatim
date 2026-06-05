import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/TranslationContext';
import { GlassCard } from '../../components/GlassCard';
import { KeyRound, Mail, Settings, Globe, Database, HelpCircle } from 'lucide-react';
import { checkFirebaseConfig, saveFirebaseConfig, clearFirebaseConfig } from '../../services/dbService';

export const Login: React.FC = () => {
  const { login, error, loading, isFirebase } = useAuth();
  const { t, language, setLanguage } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configJson, setConfigJson] = useState(() => {
    const active = checkFirebaseConfig();
    return active ? JSON.stringify(active, null, 2) : '';
  });
  const [configError, setConfigError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    await login(email, password);
  };

  const handlePresetLogin = async (presetEmail: string, presetPass: string) => {
    setEmail(presetEmail);
    setPassword(presetPass);
    await login(presetEmail, presetPass);
  };

  const handleSaveConfig = () => {
    setConfigError(null);
    try {
      if (!configJson.trim()) {
        clearFirebaseConfig();
        setShowConfigModal(false);
        return;
      }
      const parsed = JSON.parse(configJson);
      if (!parsed.apiKey || !parsed.projectId) {
        throw new Error('Config must contain at least apiKey and projectId');
      }
      saveFirebaseConfig(parsed);
      setShowConfigModal(false);
    } catch (err: any) {
      setConfigError(err.message || 'Invalid JSON format');
    }
  };

  const toggleLang = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  return (
    <div className="min-height-100 flex items-center justify-center p-4 relative" style={{ minHeight: '100vh' }}>
      
      {/* Top Header bar */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
        
        {/* Firebase Config Trigger */}
        <button
          onClick={() => setShowConfigModal(true)}
          className="p-2.5 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-neon-cyan hover:border-neon-cyan/50 hover:bg-neon-cyan/5 transition-all"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* DB Connection Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs">
          <Database className={`w-3.5 h-3.5 ${isFirebase ? 'text-neon-green' : 'text-neon-cyan animate-pulse'}`} />
          <span className="text-text-secondary">
            {isFirebase ? t('connectingFirebase') : t('runningMockMode')}
          </span>
        </div>

        {/* i18n Language Toggle */}
        <button
          onClick={toggleLang}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:border-neon-pink/50 hover:bg-neon-pink/5 text-text-secondary hover:text-white transition-all font-semibold"
        >
          <Globe className="w-4 h-4 text-neon-pink" />
          <span>{t('toggleLanguage')}</span>
        </button>
      </div>

      {/* Main Login Card */}
      <GlassCard glowColor="cyan" className="w-full max-w-md p-8 bg-slate-900/80 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-neon-cyan/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-neon-pink/10 rounded-full blur-3xl"></div>

        {/* App Title */}
        <div className="text-center mb-8 relative">
          <h1 className="text-3xl font-black tracking-tight text-white mb-2 text-glow-cyan uppercase">
            {t('appName')}
          </h1>
          <p className="text-text-secondary text-sm">
            {t('shishaWholesale')}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-neon-pink/10 border border-neon-pink/30 text-neon-pink text-xs leading-relaxed">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 mb-8">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              {t('username')}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-5 h-5 text-text-muted" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@alhan.com"
                required
                className="pl-10 text-sm"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              {t('password')}
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-3.5 w-5 h-5 text-text-muted" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="pl-10 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary-cyan py-3 w-full font-bold flex items-center justify-center gap-2 mt-2"
          >
            {loading ? t('loading') : t('login')}
          </button>
        </form>

        {/* Developer Presets panel (only visible in offline mock mode) */}
        {!isFirebase && (
          <div className="border-t border-slate-800 pt-6">
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle className="w-4 h-4 text-neon-pink" />
              <h4 className="text-xs font-bold text-neon-pink uppercase tracking-wider">
                {t('presetLogin')}
              </h4>
            </div>
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => handlePresetLogin('admin@alhan.com', 'admin')}
                className="btn-secondary py-2 text-xs flex justify-between items-center text-left"
              >
                <span>{t('adminPreset')}</span>
                <span className="text-slate-500 font-mono">admin@alhan.com (admin)</span>
              </button>

              <button
                type="button"
                onClick={() => handlePresetLogin('warehouse@alhan.com', 'warehouse')}
                className="btn-secondary py-2 text-xs flex justify-between items-center text-left"
              >
                <span>{t('warehousePreset')}</span>
                <span className="text-slate-500 font-mono">warehouse@alhan.com (warehouse)</span>
              </button>

              <button
                type="button"
                onClick={() => handlePresetLogin('rep1@alhan.com', 'rep')}
                className="btn-secondary py-2 text-xs flex justify-between items-center text-left"
              >
                <span>{t('repPreset')}</span>
                <span className="text-slate-500 font-mono">rep1@alhan.com (rep)</span>
              </button>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Firebase Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <GlassCard glowColor="cyan" className="w-full max-w-lg p-6 bg-slate-950 border border-slate-800">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Settings className="w-5 h-5 text-neon-cyan" />
              {t('firebaseConfigTitle')}
            </h3>
            <p className="text-text-secondary text-xs mb-4">
              Connect to your real Firebase project by pasting your Firebase Config JSON object below. To return to mock offline mode, clear the text box and click Apply.
            </p>

            {configError && (
              <div className="mb-4 p-3 rounded bg-neon-pink/15 border border-neon-pink/30 text-neon-pink text-xs">
                {configError}
              </div>
            )}

            <textarea
              value={configJson}
              onChange={(e) => setConfigJson(e.target.value)}
              placeholder={`{\n  "apiKey": "YOUR_API_KEY",\n  "authDomain": "...",\n  "projectId": "..."\n}`}
              rows={8}
              className="font-mono text-xs mb-4"
            />

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfigModal(false)}
                className="btn-secondary py-2 px-4 text-xs"
              >
                {t('cancel')}
              </button>
              
              {checkFirebaseConfig() && (
                <button
                  onClick={() => {
                    clearFirebaseConfig();
                    setShowConfigModal(false);
                  }}
                  className="btn-primary-pink py-2 px-4 text-xs"
                >
                  {t('resetToMock')}
                </button>
              )}

              <button
                onClick={handleSaveConfig}
                className="btn-primary-cyan py-2 px-4 text-xs"
              >
                {t('applyConfig')}
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};
