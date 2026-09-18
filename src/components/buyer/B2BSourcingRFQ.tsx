import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ProductCategory, RFQ, MatchedArtisan } from '../../types';
import { 
  Building2, 
  Sparkles, 
  Send, 
  Award, 
  MapPin, 
  CheckCircle2, 
  ArrowRight, 
  FileText, 
  Coins, 
  ShieldCheck, 
  Clock, 
  MessageSquare,
  Sliders,
  ChevronRight
} from 'lucide-react';
import { BuyerNegotiationModal } from './BuyerNegotiationModal';

export const B2BSourcingRFQ: React.FC = () => {
  const { 
    rfqs, 
    activeRFQ, 
    setActiveRFQ, 
    createRFQ, 
    b2bProfile, 
    startNegotiation, 
    activeNegotiation,
    closeNegotiation,
    placeOrderFromRFQ,
    showToast,
    t
  } = useApp();

  const [category, setCategory] = useState<ProductCategory>('pottery');
  const [quantity, setQuantity] = useState<number>(100);
  const [targetBudget, setTargetBudget] = useState<number>(1100);
  const [deliveryDate, setDeliveryDate] = useState<string>('2024-11-10');
  const [notes, setNotes] = useState<string>(
    'Diwali corporate executive hampers: 100 handcrafted pieces with custom laser-engraved wooden tag and eco-friendly gift packaging.'
  );

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleCreateRFQ = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      const created = createRFQ({
        category,
        quantity,
        targetBudget,
        deliveryDate,
        notes,
        organizationName: b2bProfile.organizationName,
      });
      setIsSubmitting(false);
      setActiveRFQ(created);
    }, 400);
  };

  const selectedRFQ = activeRFQ || rfqs[0];

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto" id="b2b-sourcing-rfq-screen">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: RFQ Form (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border border-[#EBE7E4] shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-[#EBE7E4] pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#7D6B21]" />
              <h2 className="text-sm font-bold text-[#2C2C2C]">{t('rfqHeading')}</h2>
            </div>
            <span className="text-[11px] font-semibold text-[#636466]">{t('step1Of2')}</span>
          </div>

          <form onSubmit={handleCreateRFQ} className="space-y-4">
            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-[#48454F] mb-1">
                {t('rfqCategoryLabel')}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#D0D0D4] bg-[#FAF9F6] focus:bg-white focus:outline-hidden focus:border-[#5A5187] font-medium"
              >
                <option value="pottery">Terracotta & Molela Clay Pottery (GI)</option>
                <option value="wood">Saharanpur & Channapatna Woodcraft (GI)</option>
                <option value="textiles">Pochampally Ikat & Handloom Textiles (GI)</option>
                <option value="painting">Madhubani & Warli Folk Paintings (GI)</option>
                <option value="metal">Bastar Dhokra & Moradabad Brasscraft</option>
                <option value="jewelry">Tribal Filigree & Dokra Jewelry</option>
              </select>
            </div>

            {/* Quantity */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#48454F]">{t('rfqQtyLabel')}</label>
                <span className="text-xs font-bold text-[#7D6B21]">{quantity} units</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 mb-2">
                {[50, 100, 250, 500].map((qty) => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => setQuantity(qty)}
                    className={`py-1 rounded-lg text-xs font-semibold border transition-all ${
                      quantity === qty
                        ? 'bg-[#2C2C2C] text-white border-[#2C2C2C]'
                        : 'bg-[#FAF9F6] text-[#48454F] border-[#EBE7E4] hover:bg-[#F5F5F3]'
                    }`}
                  >
                    {qty} pcs
                  </button>
                ))}
              </div>
              <input
                type="range"
                min={25}
                max={1000}
                step={25}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full accent-[#7D6B21]"
              />
            </div>

            {/* Target Budget */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#48454F]">
                  {t('rfqBudgetLabel')}
                </label>
                <span className="text-xs font-bold text-[#2C2C2C]">
                  {t('totalEstimatedLabel')}: ₹{(quantity * targetBudget).toLocaleString()}
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#636466]">₹</span>
                <input
                  type="number"
                  min={200}
                  max={15000}
                  step={50}
                  value={targetBudget}
                  onChange={(e) => setTargetBudget(Number(e.target.value))}
                  className="w-full pl-8 pr-4 py-2 text-xs rounded-xl border border-[#D0D0D4] bg-[#FAF9F6] focus:bg-white focus:outline-hidden focus:border-[#5A5187] font-semibold"
                />
              </div>
            </div>

            {/* Delivery Date */}
            <div>
              <label className="block text-xs font-bold text-[#48454F] mb-1">
                {t('rfqDeadlineLabel')}
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#D0D0D4] bg-[#FAF9F6] focus:bg-white focus:outline-hidden focus:border-[#5A5187]"
              />
            </div>

            {/* Custom Notes */}
            <div>
              <label className="block text-xs font-bold text-[#48454F] mb-1">
                {t('rfqCustomNotesLabel')}
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('rfqCustomNotesPlaceholder')}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#D0D0D4] bg-[#FAF9F6] focus:bg-white focus:outline-hidden focus:border-[#5A5187] resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-full bg-[#2C2C2C] hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50"
              id="btn-submit-rfq"
            >
              {isSubmitting ? (
                <span>Matching verified clusters...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#F4E39E]" />
                  <span>{t('rfqSubmitBtn')}</span>
                </>
              )}
            </button>
          </form>

          {/* Active RFQs Quick Selector */}
          {rfqs.length > 1 && (
            <div className="pt-3 border-t border-[#EBE7E4]">
              <div className="text-[11px] font-bold text-[#636466] uppercase mb-2">Previous RFQs</div>
              <div className="space-y-1.5">
                {rfqs.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setActiveRFQ(item)}
                    className={`p-2.5 rounded-xl border cursor-pointer text-xs flex items-center justify-between transition-colors ${
                      selectedRFQ?.id === item.id
                        ? 'border-[#7D6B21] bg-[#FFF9E6]'
                        : 'border-[#EBE7E4] hover:bg-[#FAF9F6]'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-[#2C2C2C]">
                        {item.id} • {item.category.toUpperCase()}
                      </div>
                      <div className="text-[11px] text-[#636466]">
                        {item.quantity} units @ ₹{item.targetBudget}/unit
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[#2C2C2C] border border-[#D0D0D4]">
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Matched Artisan Clusters & Negotiation Launcher (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {selectedRFQ ? (
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#EBE7E4] shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EBE7E4] pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold bg-[#FAF9F6] px-2 py-0.5 rounded-md border border-[#EBE7E4]">
                      {selectedRFQ.id}
                    </span>
                    <h3 className="text-sm font-bold text-[#2C2C2C]">
                      {t('aiMatchesTitle')} ({selectedRFQ.matchedArtisans.length})
                    </h3>
                  </div>
                  <p className="text-[11px] text-[#636466] mt-0.5">
                    {t('aiMatchesSubtitle')}
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-[#2C2C2C]">
                    Budget: ₹{selectedRFQ.targetBudget}/unit
                  </div>
                  <div className="text-[11px] text-[#7D6B21] font-semibold">
                    Volume: {selectedRFQ.quantity} units
                  </div>
                </div>
              </div>

              {/* Matched Guilds List */}
              <div className="space-y-4">
                {selectedRFQ.matchedArtisans.map((guild, idx) => {
                  const isTopPick = idx === 0;
                  return (
                    <div
                      key={guild.id}
                      className={`rounded-2xl border p-4 sm:p-5 transition-all relative ${
                        isTopPick
                          ? 'border-[#7D6B21] bg-linear-to-b from-[#FFFDF7] to-white ring-2 ring-[#F4E39E]/40'
                          : 'border-[#EBE7E4] bg-white hover:border-[#D0D0D4]'
                      }`}
                    >
                      {isTopPick && (
                        <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-[#7D6B21] text-white text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-xs">
                          <Sparkles className="w-3 h-3" />
                          <span>Top Algorithmic Match</span>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={guild.imageUrl}
                            alt={guild.name}
                            referrerPolicy="no-referrer"
                            className="w-13 h-13 rounded-2xl object-cover border border-[#EBE7E4] shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-sm font-bold text-[#2C2C2C]">{guild.name}</h4>
                              {guild.giCertified && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#5A5187] bg-[#EDE7F6] px-1.5 py-0.5 rounded-sm">
                                  <Award className="w-3 h-3" />
                                  GI
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-[#636466] flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-[#7D6B21]" />
                              <span>{guild.cluster}, {guild.location}</span>
                            </div>
                            <div className="text-[11px] text-[#48454F] font-medium mt-1">
                              ⭐ {guild.rating} rating • {guild.completedOrders} orders fulfilled • Capacity: {guild.capacityPerMonth}/mo
                            </div>
                          </div>
                        </div>

                        {/* Match Score Badge */}
                        <div className="text-left sm:text-right shrink-0">
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E6F4EA] text-[#137333] text-xs font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{guild.matchScore}% Match Score</span>
                          </div>
                          <div className="text-xs font-bold text-[#2C2C2C] mt-1">
                            Suggested: ₹{guild.suggestedPrice}/unit
                          </div>
                        </div>
                      </div>

                      {/* Score Breakdown Bars */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 mt-3 border-t border-[#EBE7E4] text-[10px]">
                        <div>
                          <div className="text-[#636466]">Skill Match</div>
                          <div className="w-full bg-[#FAF9F6] h-1.5 rounded-full overflow-hidden mt-1 border border-[#EBE7E4]">
                            <div 
                              className="bg-[#5A5187] h-full rounded-full" 
                              style={{ width: `${guild.breakdown.categoryScore}%` }} 
                            />
                          </div>
                        </div>

                        <div>
                          <div className="text-[#636466]">Budget Fit</div>
                          <div className="w-full bg-[#FAF9F6] h-1.5 rounded-full overflow-hidden mt-1 border border-[#EBE7E4]">
                            <div 
                              className="bg-[#7D6B21] h-full rounded-full" 
                              style={{ width: `${guild.breakdown.budgetScore}%` }} 
                            />
                          </div>
                        </div>

                        <div>
                          <div className="text-[#636466]">Capacity Fit</div>
                          <div className="w-full bg-[#FAF9F6] h-1.5 rounded-full overflow-hidden mt-1 border border-[#EBE7E4]">
                            <div 
                              className="bg-[#137333] h-full rounded-full" 
                              style={{ width: `${guild.breakdown.capacityScore}%` }} 
                            />
                          </div>
                        </div>

                        <div>
                          <div className="text-[#636466]">Cluster Proximity</div>
                          <div className="w-full bg-[#FAF9F6] h-1.5 rounded-full overflow-hidden mt-1 border border-[#EBE7E4]">
                            <div 
                              className="bg-[#2C2C2C] h-full rounded-full" 
                              style={{ width: `${guild.breakdown.locationScore}%` }} 
                            />
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-4 pt-3 border-t border-[#EBE7E4] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
                        {guild.speciality && (
                          <div className="text-[11px] text-[#636466] italic line-clamp-1 sm:max-w-[200px] md:max-w-xs">
                            "{guild.speciality}"
                          </div>
                        )}

                        <div className="grid grid-cols-1 min-[480px]:grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => startNegotiation(selectedRFQ, guild)}
                            className="w-full sm:w-auto px-3.5 py-2 sm:py-1.5 rounded-full bg-[#FAF9F6] border border-[#D0D0D4] hover:bg-[#F5F5F3] text-xs font-bold text-[#2C2C2C] flex items-center justify-center gap-1.5 transition-colors active:scale-[0.98]"
                            id={`btn-negotiate-${guild.id}`}
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-[#5A5187] shrink-0" />
                            <span className="truncate">{t('initiateNegotiationBtn')}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => placeOrderFromRFQ(selectedRFQ, guild, guild.suggestedPrice)}
                            className="w-full sm:w-auto px-4 py-2 sm:py-1.5 rounded-full bg-[#2C2C2C] hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-[0.98]"
                            id={`btn-lock-deal-${guild.id}`}
                          >
                            <span className="truncate">Lock at ₹{guild.suggestedPrice}</span>
                            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 border border-[#EBE7E4] shadow-xs text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#FAF9F6] border border-[#EBE7E4] flex items-center justify-center mx-auto text-[#76767F]">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-[#2C2C2C]">No active RFQ</h3>
              <p className="text-xs text-[#76767F] max-w-sm mx-auto">
                Fill out the bulk sourcing form on the left to instantly match with certified artisan guilds across India.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Collaborative Negotiation Modal */}
      {activeNegotiation && (
        <BuyerNegotiationModal
          negotiation={activeNegotiation}
          onClose={closeNegotiation}
        />
      )}
    </div>
  );
};
