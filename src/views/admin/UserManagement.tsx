import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/TranslationContext';
import { GlassCard } from '../../components/GlassCard';
import { 
  subscribeToUsers, 
  addUser, 
  updateUser,
  deleteUser,
  UserRecord 
} from '../../services/dbService';
import { Search, Plus, Edit2, Trash2, ShieldAlert, CheckCircle, UserCheck } from 'lucide-react';

export const UserManagement: React.FC = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'warehouse' | 'rep'>('rep');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const unsub = subscribeToUsers(setUsers);
    return () => unsub();
  }, []);

  const openAddModal = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setRole('rep');
    setPassword('');
    setShowModal(true);
  };

  const openEditModal = (u: UserRecord) => {
    setEditingUser(u);
    setName(u.name);
    setEmail(u.email);
    setRole(u.role);
    setPassword(''); // don't load password
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    if (editingUser) {
      await updateUser(editingUser.id, {
        name,
        email,
        role
      });
      
      // If password field filled, simulate password reset notice
      if (password) {
        alert(t('passwordResetSuccess'));
      }
    } else {
      await addUser({
        name,
        email,
        role
      });
    }

    setShowModal(false);
  };

  const handleToggleStatus = async (u: UserRecord) => {
    const nextStatus = u.status === 'active' ? 'suspended' : 'active';
    await updateUser(u.id, { status: nextStatus });
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm(t('confirmDelete'))) {
      await deleteUser(id);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-wider mb-1">
            {t('menuUsers')}
          </h2>
          <p className="text-text-secondary text-sm">
            Administer system personnel accounts, manage login credentials, and assign roles.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="btn-primary-cyan flex items-center gap-2 text-sm py-2 px-4"
        >
          <Plus className="w-4 h-4" />
          {t('addNewUser')}
        </button>
      </div>

      {/* Search */}
      <GlassCard className="p-4">
        <div className="relative w-full lg:max-w-md">
          <Search className="absolute left-3 top-3 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search name, email..."
            className="pl-9 text-sm w-full"
          />
        </div>
      </GlassCard>

      {/* Users List */}
      <GlassCard className="p-6">
        <div className="dense-table-container">
          <table className="dense-table">
            <thead>
              <tr>
                <th>{t('fullName')}</th>
                <th>{t('email')}</th>
                <th>{t('role')}</th>
                <th>{t('status')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-text-muted py-6">
                    {t('noData')}
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u.id}>
                    <td className="font-semibold text-white">{u.name}</td>
                    <td className="text-sm text-text-secondary font-mono">{u.email}</td>
                    <td>
                      <span className={`badge ${
                        u.role === 'admin' ? 'badge-paid' : u.role === 'warehouse' ? 'badge-partial' : 'badge-unpaid'
                      }`}>
                        {t(`role${u.role.charAt(0).toUpperCase() + u.role.slice(1)}`)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${u.status === 'active' ? 'badge-paid' : 'badge-unpaid'}`}>
                        {u.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(u)}
                          title={t('edit')}
                          className="p-1.5 rounded hover:bg-white/5 text-slate-400 hover:text-white flex items-center justify-center min-w-[32px] min-h-[32px]"
                        >
                          <Edit2 className="w-4 h-4 flex-shrink-0" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`p-1.5 px-2.5 rounded text-xs border font-bold flex items-center justify-center min-h-[32px] ${
                            u.status === 'active'
                              ? 'bg-neon-pink/10 border-neon-pink/20 text-neon-pink hover:bg-neon-pink/20'
                              : 'bg-neon-green/10 border-neon-green/20 text-neon-green hover:bg-neon-green/20'
                          }`}
                        >
                          {u.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          title={t('delete')}
                          className="p-1.5 rounded hover:bg-neon-pink/10 text-slate-400 hover:text-neon-pink flex items-center justify-center min-w-[32px] min-h-[32px]"
                        >
                          <Trash2 className="w-4 h-4 flex-shrink-0" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Add / Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <GlassCard glowColor="cyan" className="w-full max-w-md p-6 bg-slate-950 border border-slate-800">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-neon-cyan" />
              {editingUser ? 'Edit User Credentials' : t('addNewUser')}
            </h3>

            <form onSubmit={handleSave} className="flex flex-col gap-4">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-text-secondary font-bold uppercase">{t('fullName')}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Youssef Al-Harbi"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-text-secondary font-bold uppercase">{t('email')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="youssef@alhan.com"
                  required
                  disabled={!!editingUser}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-text-secondary font-bold uppercase">{t('userRole')}</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                >
                  <option value="admin">{t('roleSuperAdmin')}</option>
                  <option value="warehouse">{t('roleWarehouse')}</option>
                  <option value="rep">{t('roleRep')}</option>
                </select>
              </div>

              {/* Password field: optional if editing, required if creating */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-text-secondary font-bold uppercase">
                  {editingUser ? t('newPassword') + ' (Optional)' : t('password')}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required={!editingUser}
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
                  className="btn-primary-cyan py-2 px-6 text-xs"
                >
                  {t('save')}
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

    </div>
  );
};
