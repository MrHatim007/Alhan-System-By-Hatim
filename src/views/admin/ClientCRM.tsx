import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/TranslationContext';
import { GlassCard } from '../../components/GlassCard';
import { 
  subscribeToClients, 
  addClient, 
  updateClient,
  archiveClient,
  ClientRecord 
} from '../../services/dbService';
import { Search, Plus, Edit2, Trash2, Users, DollarSign, AlertTriangle } from 'lucide-react';

export const ClientCRM: React.FC = () => {
  const { t } = useTranslation();
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientRecord | null>(null);
  const [collectingClient, setCollectingClient] = useState<ClientRecord | null>(null);

  // Form states
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState(1000);

  // Collection state
  const [collectAmount, setCollectAmount] = useState(0);

  useEffect(() => {
    const unsub = subscribeToClients(setClients);
    return () => unsub();
  }, []);

  const openAddModal = () => {
    setEditingClient(null);
    setNameEn('');
    setNameAr('');
    setPhone('');
    setAddress('');
    setCreditLimit(1000);
    setShowModal(true);
  };

  const openEditModal = (c: ClientRecord) => {
    setEditingClient(c);
    setNameEn(c.nameEn);
    setNameAr(c.nameAr);
    setPhone(c.phone);
    setAddress(c.address);
    setCreditLimit(c.creditLimit);
    setShowModal(true);
  };

  const openCollectModal = (c: ClientRecord) => {
    setCollectingClient(c);
    setCollectAmount(c.outstandingDebt);
    setShowCollectModal(true);
  };

  const handleArchive = async (id: string) => {
    if (window.confirm(t('confirmArchive'))) {
      await archiveClient(id);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn || !nameAr || !phone) return;

    const payload = {
      nameEn,
      nameAr,
      phone,
      address,
      creditLimit: Number(creditLimit)
    };

    if (editingClient) {
      await updateClient(editingClient.id, payload);
    } else {
      await addClient(payload);
    }

    setShowModal(false);
  };

  const handleCollectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectingClient || collectAmount <= 0) return;

    try {
      const remainingDebt = Math.max(0, collectingClient.outstandingDebt - collectAmount);
      
      // Update outstanding debt
      await updateClient(collectingClient.id, { outstandingDebt: remainingDebt });

      // Record this collection in the invoices collection as a dummy settlement invoice or a cash incoming collection
      // For simplicity, we directly decrease client debt in dbService
      // and let the user see the visual update immediately.
      
      // Also register an inward cash movement by writing to safe log
      // In this setup, invoices and payments are tracked. Since the debt is reduced, we can add a log.
      // For now, updating the client debt record triggers the live subscription automatically.
      
      setShowCollectModal(false);
      alert(t('debtCollectedSuccess'));
    } catch (err) {
      alert('Error recording debt payment');
    }
  };

  const filteredClients = clients.filter(c => 
    c.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.nameAr.includes(searchTerm) ||
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-wider mb-1">
            {t('menuClients')}
          </h2>
          <p className="text-text-secondary text-sm">
            Manage cafe customer details, track unpaid credit sales, and enforce limits.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="btn-primary-cyan flex items-center gap-2 text-sm py-2 px-4"
        >
          <Plus className="w-4 h-4" />
          {t('addNewClient')}
        </button>
      </div>

      {/* Search Bar */}
      <GlassCard className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search code, English name, or Arabic name..."
            className="pl-9 text-sm"
          />
        </div>
      </GlassCard>

      {/* Clients list */}
      <GlassCard className="p-6">
        <div className="dense-table-container">
          <table className="dense-table">
            <thead>
              <tr>
                <th>{t('clientCode')}</th>
                <th>{t('clientName')}</th>
                <th>{t('phone')}</th>
                <th>{t('address')}</th>
                <th>{t('creditLimit')}</th>
                <th>{t('outstandingDebt')}</th>
                <th>Debt Limit Status</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-text-muted py-6">
                    {t('noData')}
                  </td>
                </tr>
              ) : (
                filteredClients.map(c => {
                  const debtRatio = c.outstandingDebt / c.creditLimit;
                  const isLimitExceeded = c.outstandingDebt >= c.creditLimit;
                  
                  // Color based on debt loading
                  const progressColor = isLimitExceeded 
                    ? 'var(--neon-pink)' 
                    : debtRatio > 0.8 
                      ? 'var(--neon-amber)' 
                      : 'var(--neon-cyan)';
                      
                  const progressShadow = isLimitExceeded 
                    ? 'var(--shadow-neon-pink)' 
                    : debtRatio > 0.8 
                      ? 'var(--shadow-neon-amber)' 
                      : 'var(--shadow-neon-cyan)';

                  return (
                    <tr key={c.id}>
                      <td className="font-mono text-neon-cyan font-semibold">{c.code}</td>
                      <td>
                        <div className="flex flex-col">
                          <span className="font-medium text-white">{c.nameEn}</span>
                          <span className="text-xs text-text-secondary font-arabic" dir="rtl">{c.nameAr}</span>
                        </div>
                      </td>
                      <td className="text-sm text-text-secondary">{c.phone}</td>
                      <td className="text-xs text-text-secondary max-w-xs truncate">{c.address}</td>
                      <td className="font-semibold text-white font-mono">${c.creditLimit}</td>
                      <td className={`font-bold font-mono ${c.outstandingDebt > 0 ? 'text-neon-pink text-glow-pink' : 'text-text-muted'}`}>
                        ${c.outstandingDebt}
                      </td>
                      <td>
                        <div className="flex flex-col gap-1 w-32">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-text-secondary">{Math.round(debtRatio * 100)}%</span>
                            {isLimitExceeded && (
                              <span className="text-neon-pink font-bold flex items-center gap-0.5 animate-pulse">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                BLOCKED
                              </span>
                            )}
                          </div>
                          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <div 
                              className="h-full rounded-full transition-all duration-300"
                              style={{ 
                                width: `${Math.min(100, debtRatio * 100)}%`,
                                backgroundColor: progressColor,
                                boxShadow: progressShadow
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          {c.outstandingDebt > 0 && (
                            <button
                              onClick={() => openCollectModal(c)}
                              title={t('collectDebt')}
                              className="p-1.5 px-2.5 rounded bg-neon-green/10 border border-neon-green/20 text-neon-green hover:bg-neon-green/20 text-xs font-bold flex items-center justify-center min-h-[32px]"
                            >
                              Collect
                            </button>
                          )}
                          <button
                            onClick={() => openEditModal(c)}
                            title={t('edit')}
                            className="p-1.5 rounded hover:bg-white/5 text-slate-400 hover:text-white flex items-center justify-center min-w-[32px] min-h-[32px]"
                          >
                            <Edit2 className="w-4 h-4 flex-shrink-0" />
                          </button>
                          <button
                            onClick={() => handleArchive(c.id)}
                            title={t('archiveItem')}
                            className="p-1.5 rounded hover:bg-neon-pink/10 text-slate-400 hover:text-neon-pink flex items-center justify-center min-w-[32px] min-h-[32px]"
                          >
                            <Trash2 className="w-4 h-4 flex-shrink-0" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Add / Edit Client Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <GlassCard glowColor="cyan" className="w-full max-w-lg p-6 bg-slate-950 border border-slate-800">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-neon-cyan" />
              {editingClient ? t('editClient') : t('addNewClient')}
            </h3>

            <form onSubmit={handleSave} className="flex flex-col gap-4">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-text-secondary font-bold uppercase">Client Name (English)</label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="Royal Palace Cafe"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-text-secondary font-bold uppercase">الاسم (العربية)</label>
                <input
                  type="text"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  placeholder="مقهى القصر الملكي"
                  required
                  className="font-arabic"
                  dir="rtl"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-text-secondary font-bold uppercase">{t('phone')}</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+971 50 123 4567"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-text-secondary font-bold uppercase">{t('creditLimit')} ($)</label>
                  <input
                    type="number"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-text-secondary font-bold uppercase">{t('address')}</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Jumeirah Road, Block B, Shop 12"
                  required
                />
              </div>

              <div className="flex gap-3 justify-end mt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary py-2 px-4 text-xs"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="btn-primary-cyan py-2 px-4 text-xs"
                >
                  {t('save')}
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

      {/* Collect Unpaid Debt Modal */}
      {showCollectModal && collectingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <GlassCard glowColor="green" className="w-full max-w-md p-6 bg-slate-950 border border-slate-800">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-neon-green" />
              {t('collectDebt')}
            </h3>

            <div className="mb-4 text-sm text-text-secondary">
              <p className="mb-1">Customer: <strong className="text-white">{collectingClient.nameEn}</strong></p>
              <p>Current Debt: <strong className="text-neon-pink font-mono">${collectingClient.outstandingDebt}</strong></p>
            </div>

            <form onSubmit={handleCollectPayment} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-text-secondary font-bold uppercase">{t('collectAmount')} ($)</label>
                <input
                  type="number"
                  min={1}
                  max={collectingClient.outstandingDebt}
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(Math.min(collectingClient.outstandingDebt, Math.max(0, Number(e.target.value))))}
                  required
                />
                <span className="text-[10px] text-text-secondary">
                  Remaining debt after collection: ${collectingClient.outstandingDebt - collectAmount}
                </span>
              </div>

              <div className="flex gap-3 justify-end mt-4">
                <button
                  type="button"
                  onClick={() => setShowCollectModal(false)}
                  className="btn-secondary py-2 px-4 text-xs"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="btn-primary-green py-2 px-6 text-xs"
                >
                  Confirm Collection
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

    </div>
  );
};
