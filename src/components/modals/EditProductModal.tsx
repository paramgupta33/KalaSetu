import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Save, Package, IndianRupee, Tag, Layers, FileText, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { ProductCategory } from '../../types';

export const EditProductModal: React.FC = () => {
  const { activeModal, modalData, closeModal, updateProduct, showToast, language } = useApp();

  const [titleEn, setTitleEn] = useState('');
  const [titleHi, setTitleHi] = useState('');
  const [category, setCategory] = useState<ProductCategory>('pottery');
  const [subcategory, setSubcategory] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [mrp, setMrp] = useState<number | ''>('');
  const [stockCount, setStockCount] = useState<number | ''>('');
  const [materials, setMaterials] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [tags, setTags] = useState('');
  const [craftStory, setCraftStory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [status, setStatus] = useState<'published' | 'draft'>('published');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (activeModal === 'edit_product' && modalData) {
      const p = modalData;
      setTitleEn(typeof p.title === 'string' ? p.title : p.title?.en || '');
      setTitleHi(typeof p.title === 'object' ? p.title?.hi || '' : '');
      setCategory(p.category || 'pottery');
      setSubcategory(p.subcategory || p.sub_category || '');
      setPrice(typeof p.price === 'number' ? p.price : '');
      setMrp(typeof p.mrp === 'number' ? p.mrp : p.price ? Math.round(p.price * 1.25) : '');
      setStockCount(typeof p.stockCount === 'number' ? p.stockCount : typeof p.stock === 'number' ? p.stock : 1);
      setMaterials(Array.isArray(p.materials) ? p.materials.join(', ') : '');
      setDimensions(p.dimensions || '');
      setTags(Array.isArray(p.tags) ? p.tags.join(', ') : '');
      setCraftStory(
        typeof p.craftStory === 'string'
          ? p.craftStory
          : typeof p.craftStory === 'object' && p.craftStory?.en
          ? p.craftStory.en
          : p.description || ''
      );
      setImageUrl(p.imageUrl || p.image_url || '');
      setStatus(p.status === 'draft' ? 'draft' : 'published');
      setErrorMsg(null);
    }
  }, [activeModal, modalData]);

  if (activeModal !== 'edit_product' || !modalData) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleEn.trim()) {
      setErrorMsg('Product title is required');
      return;
    }
    if (price === '' || Number(price) <= 0) {
      setErrorMsg('Please enter a valid price greater than ₹0');
      return;
    }
    if (stockCount === '' || Number(stockCount) < 0) {
      setErrorMsg('Please enter a valid stock quantity');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const parsedMaterials = materials
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean);
      const parsedTags = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const titleObj = {
        en: titleEn.trim(),
        ...(titleHi.trim() ? { hi: titleHi.trim() } : {}),
      };

      const updated = await updateProduct(modalData.id, {
        title: titleObj,
        category,
        categoryLabel: {
          en: category.charAt(0).toUpperCase() + category.slice(1),
        },
        price: Number(price),
        mrp: mrp !== '' ? Number(mrp) : Math.round(Number(price) * 1.25),
        stockCount: Number(stockCount),
        stock: Number(stockCount),
        materials: parsedMaterials,
        dimensions: dimensions.trim() || undefined,
        tags: parsedTags,
        imageUrl: imageUrl.trim() || modalData.imageUrl,
        craftStory: craftStory.trim() ? { en: craftStory.trim() } : undefined,
        status,
      });

      if (updated) {
        showToast(`Craft listing "${titleEn.trim()}" updated successfully!`, 'success');
        closeModal();
      } else {
        setErrorMsg('Failed to update craft. Please check backend connection and inputs.');
      }
    } catch (err: any) {
      console.error('[EditProductModal] Update failed:', err);
      setErrorMsg(err?.message || 'Failed to update craft. Please check inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#FFFFFF] rounded-3xl max-w-2xl w-full shadow-2xl border border-[#EBE7E4] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#EBE7E4] flex items-center justify-between bg-[#FAF9F6]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C5BEFF]/50 text-[#1E1A2D] flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#2C2C2C]">
                Edit Craft Listing
              </h3>
              <p className="text-xs text-[#636466]">
                SKU: {modalData.sku || 'KALA-CRF'} • Real Supabase Synced
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-2 rounded-full text-[#76767F] hover:bg-[#EBE7E4] transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 text-xs text-[#2C2C2C]">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Product Image Preview & URL */}
          <div className="bg-[#FAF9F6] p-4 rounded-2xl border border-[#EBE7E4] space-y-3">
            <label className="font-bold text-[#2C2C2C] flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-[#5A5187]" />
              <span>Product Image</span>
            </label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-white border border-[#D0D0D4] shrink-0">
                <img
                  src={imageUrl || 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&q=80&w=800'}
                  alt="Product preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 space-y-1">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-white border border-[#EBE7E4] rounded-xl px-3 py-2 text-xs text-[#2C2C2C] focus:ring-1 focus:ring-[#5A5187] focus:outline-none"
                />
                <span className="text-[10px] text-[#76767F] block">
                  Provide high-resolution image URL or keep existing master photo.
                </span>
              </div>
            </div>
          </div>

          {/* Title Inputs (English & Hindi) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-[#2C2C2C] block mb-1">
                Craft Title (English) *
              </label>
              <input
                type="text"
                required
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                placeholder="e.g. Terracotta Handpainted Decorative Vase"
                className="w-full bg-[#FAF9F6] border border-[#EBE7E4] rounded-xl px-3 py-2 text-xs text-[#2C2C2C] focus:bg-white focus:ring-1 focus:ring-[#5A5187] focus:outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-[#2C2C2C] block mb-1">
                Craft Title (Hindi / Local)
              </label>
              <input
                type="text"
                value={titleHi}
                onChange={(e) => setTitleHi(e.target.value)}
                placeholder="e.g. मिट्टी का नक्काशीदार फूलदान"
                className="w-full bg-[#FAF9F6] border border-[#EBE7E4] rounded-xl px-3 py-2 text-xs text-[#2C2C2C] focus:bg-white focus:ring-1 focus:ring-[#5A5187] focus:outline-none"
              />
            </div>
          </div>

          {/* Category & Subcategory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-[#2C2C2C] block mb-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-[#5A5187]" />
                <span>Craft Category *</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                className="w-full bg-[#FAF9F6] border border-[#EBE7E4] rounded-xl px-3 py-2 text-xs text-[#2C2C2C] focus:bg-white focus:ring-1 focus:ring-[#5A5187] focus:outline-none cursor-pointer"
              >
                <option value="pottery">Pottery & Terracotta</option>
                <option value="textiles">Handloom & Textiles</option>
                <option value="brass">Brass & Bell Metal</option>
                <option value="wood">Wood Carving & Inlay</option>
                <option value="jute">Jute & Natural Fiber</option>
                <option value="painting">Traditional Painting (Madhubani, Pattachitra)</option>
                <option value="metal">Metal & Dhokra Craft</option>
                <option value="jewelry">Tribal & Beaded Jewelry</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-[#2C2C2C] block mb-1">
                Subcategory / Cluster
              </label>
              <input
                type="text"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                placeholder="e.g. Khurja Blue Pottery, Pochampally Ikat"
                className="w-full bg-[#FAF9F6] border border-[#EBE7E4] rounded-xl px-3 py-2 text-xs text-[#2C2C2C] focus:bg-white focus:ring-1 focus:ring-[#5A5187] focus:outline-none"
              />
            </div>
          </div>

          {/* Price & Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-[#2C2C2C] block mb-1 flex items-center gap-1">
                <IndianRupee className="w-3.5 h-3.5 text-[#7D6B21]" />
                <span>Retail Price (₹) *</span>
              </label>
              <input
                type="number"
                required
                min="1"
                value={price}
                onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : '')}
                placeholder="1450"
                className="w-full bg-[#FAF9F6] border border-[#EBE7E4] rounded-xl px-3 py-2 text-xs text-[#2C2C2C] focus:bg-white focus:ring-1 focus:ring-[#5A5187] focus:outline-none font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-[#2C2C2C] block mb-1">
                MRP / Strike Price (₹)
              </label>
              <input
                type="number"
                min="1"
                value={mrp}
                onChange={(e) => setMrp(e.target.value ? Number(e.target.value) : '')}
                placeholder="1800"
                className="w-full bg-[#FAF9F6] border border-[#EBE7E4] rounded-xl px-3 py-2 text-xs text-[#2C2C2C] focus:bg-white focus:ring-1 focus:ring-[#5A5187] focus:outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-[#2C2C2C] block mb-1 flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-[#4A5950]" />
                <span>Available Stock *</span>
              </label>
              <input
                type="number"
                required
                min="0"
                value={stockCount}
                onChange={(e) => setStockCount(e.target.value ? Number(e.target.value) : '')}
                placeholder="12"
                className="w-full bg-[#FAF9F6] border border-[#EBE7E4] rounded-xl px-3 py-2 text-xs text-[#2C2C2C] focus:bg-white focus:ring-1 focus:ring-[#5A5187] focus:outline-none"
              />
            </div>
          </div>

          {/* Materials, Dimensions, Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-[#2C2C2C] block mb-1">
                Materials (comma-separated)
              </label>
              <input
                type="text"
                value={materials}
                onChange={(e) => setMaterials(e.target.value)}
                placeholder="Red Clay, Natural Mineral Dyes, Terracotta"
                className="w-full bg-[#FAF9F6] border border-[#EBE7E4] rounded-xl px-3 py-2 text-xs text-[#2C2C2C] focus:bg-white focus:ring-1 focus:ring-[#5A5187] focus:outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-[#2C2C2C] block mb-1">
                Dimensions & Weight
              </label>
              <input
                type="text"
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                placeholder="12cm x 25cm x 12cm (850g)"
                className="w-full bg-[#FAF9F6] border border-[#EBE7E4] rounded-xl px-3 py-2 text-xs text-[#2C2C2C] focus:bg-white focus:ring-1 focus:ring-[#5A5187] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-[#2C2C2C] block mb-1 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-[#5A5187]" />
              <span>Search Tags (comma-separated)</span>
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="handcrafted, diwali, home-decor, organic, heritage"
              className="w-full bg-[#FAF9F6] border border-[#EBE7E4] rounded-xl px-3 py-2 text-xs text-[#2C2C2C] focus:bg-white focus:ring-1 focus:ring-[#5A5187] focus:outline-none"
            />
          </div>

          {/* Craft Story / Description */}
          <div>
            <label className="font-bold text-[#2C2C2C] block mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-[#5A5187]" />
              <span>Craft Story & Authentic Technique</span>
            </label>
            <textarea
              rows={3}
              value={craftStory}
              onChange={(e) => setCraftStory(e.target.value)}
              placeholder="Handmade using traditional wood-fired kilns passed down through 4 generations of master artisans..."
              className="w-full bg-[#FAF9F6] border border-[#EBE7E4] rounded-xl p-3 text-xs text-[#2C2C2C] focus:bg-white focus:ring-1 focus:ring-[#5A5187] focus:outline-none resize-none"
            />
          </div>

          {/* Listing Status */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF9F6] border border-[#EBE7E4]">
            <div>
              <span className="font-bold text-[#2C2C2C] block">Marketplace Status</span>
              <span className="text-[10px] text-[#76767F]">
                {status === 'published' ? 'Live on buyer marketplace and discover feeds' : 'Draft mode (hidden from buyers)'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStatus('draft')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  status === 'draft' ? 'bg-[#2C2C2C] text-white' : 'bg-white text-[#636466] border border-[#EBE7E4]'
                }`}
              >
                Draft
              </button>
              <button
                type="button"
                onClick={() => setStatus('published')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  status === 'published' ? 'bg-[#4A5950] text-white' : 'bg-white text-[#636466] border border-[#EBE7E4]'
                }`}
              >
                Published
              </button>
            </div>
          </div>

          {/* Submit / Cancel Buttons */}
          <div className="pt-2 border-t border-[#EBE7E4] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={closeModal}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-full border border-[#EBE7E4] bg-white text-xs font-semibold text-[#636466] hover:bg-[#F5F5F3] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 rounded-full bg-[#2C2C2C] hover:bg-black text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Saving Changes...' : 'Save & Sync'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
