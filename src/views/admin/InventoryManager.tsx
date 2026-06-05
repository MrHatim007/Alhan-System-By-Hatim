import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/TranslationContext';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/GlassCard';
import { 
  subscribeToProducts, 
  addProduct, 
  updateProduct,
  ProductRecord 
} from '../../services/dbService';
import { Search, Plus, Edit2, Package, Eye, AlertTriangle } from 'lucide-react';

export const InventoryManager: React.FC = () => {
  const { t, language } = useTranslation();
  const { user } = useAuth();
  
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductRecord | null>(null);

  // Form states
  const [sku, setSku] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [category, setCategory] = useState<'Shisha' | 'Charcoal' | 'Accessories' | 'Other'>('Shisha');
  const [costPrice, setCostPrice] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [warehouseStock, setWarehouseStock] = useState(0);
  const [minStockAlert, setMinStockAlert] = useState(10);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const unsub = subscribeToProducts(setProducts);
    return () => unsub();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setSku('');
    setNameEn('');
    setNameAr('');
    setCategory('Shisha');
    setCostPrice(0);
    setSellingPrice(0);
    setWarehouseStock(0);
    setMinStockAlert(10);
    setShowModal(true);
  };

  const openEditModal = (p: ProductRecord) => {
    setEditingProduct(p);
    setSku(p.sku);
    setNameEn(p.nameEn);
    setNameAr(p.nameAr);
    setCategory(p.category);
    setCostPrice(p.costPrice);
    setSellingPrice(p.sellingPrice);
    setWarehouseStock(p.warehouseStock);
    setMinStockAlert(p.minStockAlert);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku || !nameEn || !nameAr) return;

    const payload = {
      sku,
      nameEn,
      nameAr,
      category,
      costPrice: Number(costPrice),
      sellingPrice: Number(sellingPrice),
      warehouseStock: Number(warehouseStock),
      vanStock: editingProduct ? editingProduct.vanStock : 0,
      minStockAlert: Number(minStockAlert)
    };

    if (editingProduct) {
      await updateProduct(editingProduct.id, payload);
    } else {
      await addProduct(payload);
    }
    
    setShowModal(false);
  };

  const filteredProducts = products.filter(p => {
    const matchSearch = 
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nameAr.includes(searchTerm);
      
    const matchCategory = categoryFilter === 'All' || p.category === categoryFilter;
    
    return matchSearch && matchCategory;
  });

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-wider mb-1">
            {t('menuInventory')}
          </h2>
          <p className="text-text-secondary text-sm">
            Manage product details, track main warehouse vs. van inventories.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="btn-primary-cyan flex items-center gap-2 text-sm py-2 px-4"
        >
          <Plus className="w-4 h-4" />
          {t('addNewProduct')}
        </button>
      </div>

      {/* Filter Bar */}
      <GlassCard className="p-4 flex flex-col md:flex-row gap-4">
        
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('search')}
            className="pl-9 text-sm w-full"
          />
        </div>

        {/* Category selector */}
        <div className="w-full md:w-64">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-sm w-full"
          >
            <option value="All">{t('all')}</option>
            <option value="Shisha">{t('categoryShisha')}</option>
            <option value="Charcoal">{t('categoryCharcoal')}</option>
            <option value="Accessories">{t('categoryAccessories')}</option>
            <option value="Other">{t('categoryOther')}</option>
          </select>
        </div>

      </GlassCard>

      {/* Products Table */}
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
                <th>{t('totalStock')}</th>
                {isAdmin && <th>{t('costPrice')}</th>}
                <th>{t('sellingPrice')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 9 : 8} className="text-center text-text-muted py-6">
                    {t('noData')}
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => {
                  const isLow = p.warehouseStock <= p.minStockAlert;
                  const totalStock = p.warehouseStock + p.vanStock;
                  return (
                    <tr key={p.id} className={isLow ? 'bg-neon-amber/5' : ''}>
                      <td className="font-mono text-neon-cyan font-semibold">{p.sku}</td>
                      <td>
                        <div className="flex flex-col">
                          <span className="font-medium text-white">{p.nameEn}</span>
                          <span className="text-xs text-text-secondary font-arabic" dir="rtl">{p.nameAr}</span>
                        </div>
                      </td>
                      <td>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
                          {p.category}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <span className={`font-bold ${isLow ? 'text-neon-amber text-glow-amber' : 'text-white'}`}>
                            {p.warehouseStock}
                          </span>
                          {isLow && <AlertTriangle className="w-3.5 h-3.5 text-neon-amber animate-pulse" />}
                        </div>
                      </td>
                      <td className="text-text-secondary">{p.vanStock}</td>
                      <td className="font-bold text-white">{totalStock}</td>
                      {isAdmin && <td className="text-text-secondary font-mono">${p.costPrice}</td>}
                      <td className="text-neon-green font-mono font-semibold">${p.sellingPrice}</td>
                      <td>
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 rounded hover:bg-white/5 text-slate-400 hover:text-white"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Add / Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <GlassCard glowColor="cyan" className="w-full max-w-lg p-6 bg-slate-950 border border-slate-800">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Package className="w-5 h-5 text-neon-cyan" />
              {editingProduct ? t('editProduct') : t('addNewProduct')}
            </h3>

            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-text-secondary font-bold uppercase">{t('sku')}</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value.toUpperCase())}
                    placeholder="SHI-ALF-03"
                    required
                    disabled={!!editingProduct}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-text-secondary font-bold uppercase">{t('category')}</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                  >
                    <option value="Shisha">{t('categoryShisha')}</option>
                    <option value="Charcoal">{t('categoryCharcoal')}</option>
                    <option value="Accessories">{t('categoryAccessories')}</option>
                    <option value="Other">{t('categoryOther')}</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-text-secondary font-bold uppercase">Name (English)</label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="Al-Fakher Lemon 1kg"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-text-secondary font-bold uppercase">الاسم (العربية)</label>
                <input
                  type="text"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  placeholder="معسل الفاخر ليمون 1 كيلو"
                  required
                  className="font-arabic"
                  dir="rtl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Cost price input - hidden if warehouse manager */}
                {isAdmin ? (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-text-secondary font-bold uppercase">{t('costPrice')} ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={costPrice}
                      onChange={(e) => setCostPrice(Number(e.target.value))}
                      required
                    />
                  </div>
                ) : (
                  // Empty space if not admin to keep alignment
                  <div></div>
                )}
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-text-secondary font-bold uppercase">{t('sellingPrice')} ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-text-secondary font-bold uppercase">{t('warehouseStock')}</label>
                  <input
                    type="number"
                    value={warehouseStock}
                    onChange={(e) => setWarehouseStock(Number(e.target.value))}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-text-secondary font-bold uppercase">{t('minStock')}</label>
                  <input
                    type="number"
                    value={minStockAlert}
                    onChange={(e) => setMinStockAlert(Number(e.target.value))}
                    required
                  />
                </div>
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

    </div>
  );
};
