import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ShoppingBag, 
  Building2, 
  Sparkles, 
  Check, 
  ArrowRight, 
  X, 
  ShieldCheck, 
  Coins, 
  PackageCheck 
} from 'lucide-react';
import { BuyerMode } from '../../types';

interface PersonaSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PersonaSelectorModal: React.FC<PersonaSelectorModalProps> = ({ isOpen, onClose }) => {
  const { 
    buyerMode, 
    setBuyerMode, 
    b2bProfile, 
    updateB2BProfile, 
    setHasSelectedPersona,
    showToast 
  } = useApp();

  const [selectedMode, setSelectedMode] = useState<BuyerMode>(buyerMode);
  const [orgName, setOrgName] = useState(b2bProfile.organizationName || '');
  const [industry, setIndustry] = useState(b2bProfile.buyerIndustry || 'corporate');
  const [volume, setVolume] = useState(b2bProfile.sourcingVolume || 'volume_200_1000');
  const [contactName, setContactName] = useState(b2bProfile.contactPerson || '');

  if (!isOpen) return null;

  const quickPresets = [
    {
      name: 'Tata Consultancy Services - ESG Gifting',
      industry: 'corporate',
      volume: 'volume_200_1000',
      contact: 'Aditi Deshmukh',
      label: 'TCS Corporate Gifting',
    },
    {
      name: 'FabIndia Heritage Retail Sourcing',
      industry: 'retail',
      volume: 'volume_1000_plus',
      contact: 'Vikram Malhotra',
      label: 'Retail Merchandising',
    },
    {
      name: 'The Leela Palace Heritage Hotels',
      industry: 'hospitality',
      volume: 'volume_50_200',
      contact: 'Sunita Rao',
      label: 'Luxury Hospitality Decor',
    },
  ];

  const handleSave = () => {
    setBuyerMode(selectedMode);
    setHasSelectedPersona(true);

    if (selectedMode === 'business') {
      updateB2BProfile({
        organizationName: orgName || 'Corporate Enterprise Partner',
        buyerIndustry: industry,
        industry,
        sourcingVolume: volume,
        targetVolume: volume,
        contactPerson: contactName || 'Sourcing Manager',
      });
      showToast('Switched to B2B Bulk Sourcing Persona', 'success');
    } else {
      showToast('Switched to Personal Consumer Sourcing', 'success');
    }

    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      id="modal-persona-selector"
    >
      <div className="bg-[#FAF9F6] border border-[#EBE7E4] rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col">
        {/* Top Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#EBE7E4]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F4E39E] text-[#272105] text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#7D6B21]" />
              Buyer Persona Setup
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-[#2C2C2C] tracking-tight">
              Select Your Sourcing Profile
            </h2>
            <p className="text-xs md:text-sm text-[#636466] mt-0.5">
              Customize your experience for individual artisan craft discovery or enterprise bulk procurement.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white border border-[#D0D0D4] flex items-center justify-center text-[#48454F] hover:bg-[#F5F5F3] transition-all"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 py-5 space-y-6 pr-1">
          {/* Persona Mode Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Personal / B2C */}
            <div
              onClick={() => setSelectedMode('personal')}
              className={`cursor-pointer rounded-2xl p-4.5 border-2 transition-all select-none relative flex flex-col justify-between ${
                selectedMode === 'personal'
                  ? 'border-[#5A5187] bg-white shadow-md'
                  : 'border-[#EBE7E4] bg-[#FFFFFF]/60 hover:bg-white hover:border-[#D0D0D4]'
              }`}
              id="persona-opt-personal"
            >
              {selectedMode === 'personal' && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#5A5187] text-white flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#EDE7F6] text-[#5A5187] flex items-center justify-center mb-3">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#2C2C2C]">
                  Personal Sourcing
                </h3>
                <p className="text-xs text-[#636466] mt-1 leading-relaxed">
                  Shop authentic GI-certified crafts for personal use, home decor, or individual gifting directly from rural master makers.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#EBE7E4] flex items-center gap-2 text-[11px] font-semibold text-[#5A5187]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Single-unit retail pricing & instant checkout</span>
              </div>
            </div>

            {/* Business / B2B */}
            <div
              onClick={() => setSelectedMode('business')}
              className={`cursor-pointer rounded-2xl p-4.5 border-2 transition-all select-none relative flex flex-col justify-between ${
                selectedMode === 'business'
                  ? 'border-[#7D6B21] bg-white shadow-md ring-2 ring-[#F4E39E]/50'
                  : 'border-[#EBE7E4] bg-[#FFFFFF]/60 hover:bg-white hover:border-[#D0D0D4]'
              }`}
              id="persona-opt-business"
            >
              {selectedMode === 'business' && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#7D6B21] text-white flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#FFF9E6] text-[#7D6B21] flex items-center justify-center mb-3">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#2C2C2C]">
                  Enterprise / B2B Bulk
                </h3>
                <p className="text-xs text-[#636466] mt-1 leading-relaxed">
                  Procure at scale for corporate festivals, ESG initiatives, hospitality decor, or retail merchandising with bulk pricing tiers.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#EBE7E4] flex items-center gap-2 text-[11px] font-semibold text-[#7D6B21]">
                <Coins className="w-3.5 h-3.5" />
                <span>Volume pricing, AI RFQ matching & negotiations</span>
              </div>
            </div>
          </div>

          {/* Conditional B2B Configuration Fields */}
          {selectedMode === 'business' && (
            <div className="bg-white rounded-2xl p-5 border border-[#EBE7E4] space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#7D6B21]">
                  Corporate Sourcing Credentials
                </h4>
                <span className="text-[11px] text-[#636466]">Demo Presets</span>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-2">
                {quickPresets.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setOrgName(preset.name);
                      setIndustry(preset.industry);
                      setVolume(preset.volume);
                      setContactName(preset.contact);
                    }}
                    className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#F5F5F3] hover:bg-[#F4E39E]/60 text-[#2C2C2C] border border-[#EBE7E4] transition-colors"
                  >
                    ⚡ {preset.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-[#48454F] mb-1">
                    Organization / Company Name
                  </label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. Tata Consultancy Services"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#D0D0D4] bg-[#FAF9F6] focus:bg-white focus:outline-hidden focus:border-[#7D6B21]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#48454F] mb-1">
                    Sourcing Manager / Contact
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Aditi Deshmukh"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#D0D0D4] bg-[#FAF9F6] focus:bg-white focus:outline-hidden focus:border-[#7D6B21]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#48454F] mb-1">
                    Industry Domain
                  </label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#D0D0D4] bg-[#FAF9F6] focus:bg-white focus:outline-hidden focus:border-[#7D6B21]"
                  >
                    <option value="corporate">Corporate / IT / ESG Gifting</option>
                    <option value="hospitality">Hospitality / Luxury Hotels</option>
                    <option value="retail">Retail Merchandising & Boutiques</option>
                    <option value="event">Wedding & Event Planning</option>
                    <option value="export">Handicrafts Export House</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#48454F] mb-1">
                    Typical Order Volume Tier
                  </label>
                  <select
                    value={volume}
                    onChange={(e) => setVolume(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#D0D0D4] bg-[#FAF9F6] focus:bg-white focus:outline-hidden focus:border-[#7D6B21]"
                  >
                    <option value="volume_25_50">25 – 50 units (Small Batch / VIP Gifting)</option>
                    <option value="volume_50_200">50 – 200 units (Medium Festive Orders)</option>
                    <option value="volume_200_1000">200 – 1,000 units (Large Scale Corporate)</option>
                    <option value="volume_1000_plus">1,000+ units (National Procurement)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-[#EBE7E4] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-full border border-[#D0D0D4] text-xs font-semibold text-[#48454F] hover:bg-[#F5F5F3] transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-full bg-[#2C2C2C] hover:bg-[#1A1A1A] text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-95"
            id="btn-confirm-persona"
          >
            <span>Continue as {selectedMode === 'business' ? 'B2B Enterprise Buyer' : 'Personal Shopper'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
