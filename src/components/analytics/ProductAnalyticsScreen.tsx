import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SalesSplineChart } from '../dashboard/SalesSplineChart';
import { 
  Package, 
  Eye, 
  ShoppingBag, 
  TrendingUp, 
  Calendar, 
  Edit3, 
  Share2, 
  Sliders, 
  Sparkles, 
  ZoomIn, 
  CheckCircle, 
  Camera, 
  Percent, 
  IndianRupee,
  Gift,
  PenTool,
  Paintbrush,
  ArrowLeft
} from 'lucide-react';

export const ProductAnalyticsScreen: React.FC = () => {
  const { 
    selectedAnalyticsProduct, 
    products, 
    setSelectedAnalyticsProduct, 
    salesPeriod, 
    setSalesPeriod, 
    setActiveTab, 
    openModal, 
    showToast,
    artisanAnalytics,
    fetchArtisanAnalytics,
    language,
    orders,
  } = useApp();

  const product = selectedAnalyticsProduct || products[0];

  React.useEffect(() => {
    if (product?.id) {
      fetchArtisanAnalytics(salesPeriod, product.id);
    }
  }, [product?.id, salesPeriod, fetchArtisanAnalytics]);

  if (!product) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setActiveTab('catalogue')}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#5A5187] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Catalogue</span>
          </button>
        </div>
        <div className="bg-[#FFFFFF] border border-[#EBE7E4] rounded-3xl p-12 text-center shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#FAF9F6] border border-[#EBE7E4] flex items-center justify-center mx-auto text-[#76767F]">
            <Package className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-[#2C2C2C]">No craft analytics yet</h2>
          <p className="text-xs text-[#76767F] max-w-sm mx-auto">
            Once you publish your handcrafted products to the marketplace, real-time sales curves, buyer views, and demand metrics will appear here.
          </p>
          <button
            onClick={() => setActiveTab('catalogue')}
            className="px-5 py-2.5 rounded-full bg-[#2C2C2C] text-white text-xs font-bold hover:bg-black transition-all"
          >
            Go to Studio Catalogue
          </button>
        </div>
      </div>
    );
  }

  // 1. Calculate orders matching this specific product for the selected period
  const numDays = salesPeriod === '7d' ? 7 : salesPeriod === '90d' ? 90 : salesPeriod === 'all' ? 365 : 30;
  const now = new Date();
  const startDate = new Date();
  startDate.setDate(now.getDate() - numDays);
  startDate.setHours(0, 0, 0, 0);

  const matchingOrders = (orders || []).filter((o) => {
    if ((o.status as string) === 'cancelled') return false;
    if (salesPeriod !== 'all') {
      const dateStr = o.created_at || o.createdAt || (o as any).date;
      if (dateStr) {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime()) && d < startDate) return false;
      }
    }
    if (o.productId === product.id) return true;
    if (o.items && Array.isArray(o.items)) {
      return o.items.some(
        (it: any) =>
          it.product?.id === product.id ||
          it.product_id === product.id ||
          it.product?.sku === product.sku
      );
    }
    return false;
  });

  const ordersUnits = matchingOrders.reduce((sum, ord) => {
    if (ord.items && Array.isArray(ord.items) && ord.items.length > 0) {
      const itm = ord.items.find(
        (it: any) =>
          it.product?.id === product.id ||
          it.product_id === product.id ||
          it.product?.sku === product.sku
      );
      return sum + (itm?.quantity || 1);
    }
    return sum + (ord.quantity || 1);
  }, 0);

  const ordersRevenue = matchingOrders.reduce((sum, ord) => {
    if (ord.items && Array.isArray(ord.items) && ord.items.length > 0) {
      const itm = ord.items.find(
        (it: any) =>
          it.product?.id === product.id ||
          it.product_id === product.id ||
          it.product?.sku === product.sku
      );
      const unitPr = Number(itm?.unitPrice || itm?.price || itm?.product?.price || product.price || 0);
      return sum + unitPr * (itm?.quantity || 1);
    }
    return sum + (Number(ord.totalAmount) || Number(product.price || 0) * (ord.quantity || 1));
  }, 0);

  // 2. Find product-specific analytics from backend
  const matchingItem = artisanAnalytics?.products?.find((p) => p.product_id === product.id);
  const hasBackend = Boolean(artisanAnalytics && (matchingItem || artisanAnalytics.total_revenue !== undefined));

  // Total revenue: SUM(order_items.price * order_items.quantity) for non-cancelled orders
  const productRevenue = hasBackend
    ? (matchingItem ? Number(matchingItem.revenue) : Number(artisanAnalytics?.total_revenue || 0))
    : ordersRevenue;

  // Units Ordered = SUM(order_items.quantity)
  const unitsOrdered = hasBackend
    ? (matchingItem ? Number(matchingItem.units_sold) : Number(artisanAnalytics?.total_units_sold || 0))
    : ordersUnits;

  // Bespoke customizations dynamic calculation
  const bespokeRequestsCount = matchingOrders.filter((o) => !!o.customRequest).length;
  const bespokeRevenue = matchingOrders.reduce((sum, o) => {
    if (o.customRequest) {
      return sum + (Number(o.customRequest.specialFee) || 250);
    }
    return sum;
  }, 0);

  // Real product views from database
  const viewsCount = typeof matchingItem?.views === 'number'
    ? matchingItem.views
    : (typeof product.views === 'number' ? product.views : 0);

  // Real conversion rate: uses real views/orders
  const effectiveViews = Math.max(viewsCount, unitsOrdered);
  const calculatedConvRate = effectiveViews > 0
    ? ((unitsOrdered / effectiveViews) * 100).toFixed(1)
    : '0.0';
  const conversionRate = matchingItem?.conversion_rate && matchingItem.conversion_rate !== '0.0'
    ? matchingItem.conversion_rate
    : calculatedConvRate;

  const handleShare = () => {
    navigator.clipboard?.writeText?.(window.location.href);
    showToast(`Analytics report link for "${product.title.en}" copied!`, 'info');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Back button & Product Selector */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => setActiveTab('catalogue')}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#5A5187] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Catalogue</span>
        </button>

        {/* Quick Product Switcher */}
        <select
          value={product.id}
          onChange={(e) => {
            const found = products.find((p) => p.id === e.target.value);
            if (found) setSelectedAnalyticsProduct(found);
          }}
          className="text-xs font-semibold bg-white border border-[#EBE7E4] rounded-xl px-3 py-1.5 text-[#222222] focus:ring-1 focus:ring-[#5A5187]"
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title.en} ({p.sku})
            </option>
          ))}
        </select>
      </div>

      {/* 1. PRODUCT SUMMARY HEADER CARD */}
      <div className="bg-[#FFFFFF] border border-[#EBE7E4] rounded-3xl p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
          <div className="flex items-start gap-4">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-[#F5F5F3] shrink-0 border border-[#D0D0D4]">
              <img
                src={product.imageUrl}
                alt={product.altText}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-1 right-1 bg-[#2C2C2C]/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <Camera className="w-3 h-3" />
                <span>4</span>
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="bg-[#D3E0D7] text-[#4A5950] px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4A5950]" />
                  ACTIVE • IN STOCK
                </span>
                <span className="text-xs text-[#636466] font-mono">SKU: {product.sku}</span>
              </div>
              <h1 className="text-base sm:text-xl font-bold text-[#222222] tracking-tight">
                {product.title[language] || product.title.en}
              </h1>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl sm:text-2xl font-extrabold text-[#2C2C2C]">
                  ₹ {product.price.toLocaleString()}
                </span>
                <span className="text-xs text-[#636466]">Listed 12 Aug 2024</span>
              </div>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 border-[#EBE7E4] pt-3 sm:pt-0">
            <span className="text-xs text-[#636466]">Inventory Level</span>
            <div className="flex items-center gap-1.5 text-[#4A5950] font-bold text-sm sm:text-base mt-0.5">
              <Package className="w-4 h-4" />
              <span>{product.stockCount} Units Left</span>
            </div>
          </div>
        </div>

        {/* Quick Action Pills */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#F5F5F3] overflow-x-auto no-scrollbar">
          <button
            onClick={() => openModal('edit_product', product)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#F5F5F3] hover:bg-[#EBE7E4] text-[#222222] text-xs font-semibold active:scale-95 transition-all whitespace-nowrap"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#5A5187]" />
            <span>Edit Product</span>
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#F5F5F3] hover:bg-[#EBE7E4] text-[#222222] text-xs font-semibold active:scale-95 transition-all whitespace-nowrap"
          >
            <Share2 className="w-3.5 h-3.5 text-[#7D6B21]" />
            <span>Share Listing</span>
          </button>
          <button
            onClick={() => openModal('qr_code', product)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#F5F5F3] hover:bg-[#EBE7E4] text-[#222222] text-xs font-semibold active:scale-95 transition-all whitespace-nowrap"
          >
            <Sliders className="w-3.5 h-3.5 text-[#4A5950]" />
            <span>QR Certificate</span>
          </button>
        </div>
      </div>

      {/* 2. TIME PERIOD FILTER SELECTOR */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-1">
        <div className="flex items-center gap-2">
          {(['7d', '30d', '90d', 'all'] as const).map((period) => {
            const labels = {
              '7d': 'Last 7 Days',
              '30d': 'Last 30 Days',
              '90d': '90 Days',
              all: 'All Time',
            };
            const isSelected = salesPeriod === period;
            return (
              <button
                key={period}
                onClick={() => setSalesPeriod(period)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#2C2C2C] text-white shadow-xs'
                    : 'bg-[#F5F5F3] text-[#636466] hover:bg-[#EBE7E4]'
                }`}
              >
                {labels[period]}
              </button>
            );
          })}
        </div>

        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#EBE7E4] bg-white text-xs font-medium text-[#222222] shrink-0">
          <Calendar className="w-3.5 h-3.5 text-[#5A5187]" />
          <span>Oct 1 - Oct 31</span>
        </button>
      </div>

      {/* 3. KEY PERFORMANCE KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Revenue */}
        <div className="relative overflow-hidden bg-[#F4E39E] rounded-2xl p-4 sm:p-5 border border-[#DFCD7E] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#272105]">
              Total Revenue ({salesPeriod === '7d' ? 'Last 7 Days' : salesPeriod === '30d' ? 'This Month' : salesPeriod === '90d' ? 'This Quarter' : 'All Time'})
            </span>
            <div className="w-8 h-8 rounded-lg bg-white/40 flex items-center justify-center text-[#272105]">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-extrabold text-[#272105]">₹{productRevenue.toLocaleString()}</div>
            <div className="flex items-center gap-1 mt-1 text-[#272105]/80 text-[11px]">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{productRevenue > 0 ? `${unitsOrdered} units ordered` : '₹0 this period'}</span>
            </div>
          </div>
        </div>

        {/* Units Ordered */}
        <div className="bg-[#FFFFFF] rounded-2xl p-4 sm:p-5 border border-[#EBE7E4] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#636466]">Units Ordered</span>
            <div className="w-8 h-8 rounded-lg bg-[#C5BEFF] flex items-center justify-center text-[#1E1A2D]">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-extrabold text-[#222222]">{unitsOrdered} Units</div>
            <div className="text-[11px] text-[#636466] mt-1">{unitsOrdered > 0 ? `${unitsOrdered} units fulfilled` : 'No orders yet'}</div>
          </div>
        </div>

        {/* Product Views */}
        <div className="bg-[#FFFFFF] rounded-2xl p-4 sm:p-5 border border-[#EBE7E4] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#636466]">Product Views</span>
            <div className="w-8 h-8 rounded-lg bg-[#F5F5F3] flex items-center justify-center text-[#222222]">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-extrabold text-[#222222]">{viewsCount} Views</div>
            <div className="flex items-center gap-1 mt-1 text-[#4A5950] text-[11px] font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{viewsCount > 0 ? `${viewsCount} total buyer visits` : '0 buyer visits'}</span>
            </div>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-[#FFFFFF] rounded-2xl p-4 sm:p-5 border border-[#EBE7E4] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#636466]">Conversion Rate</span>
            <div className="w-8 h-8 rounded-lg bg-[#D3E0D7] flex items-center justify-center text-[#252B28]">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-extrabold text-[#222222]">{conversionRate}%</div>
            <div className="flex items-center gap-1 mt-1 text-[#4A5950] text-[11px] font-semibold">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{unitsOrdered > 0 ? 'Orders converted' : 'Awaiting first order'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. SALES & ORDERS SPLINE GRAPH */}
      <SalesSplineChart productId={product.id} />

      {/* 5. PHOTO ZOOM INSIGHTS & CUSTOMIZATION DEMAND */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Photo Zoom Insights */}
        <div className="bg-[#FFFFFF] border border-[#EBE7E4] rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base sm:text-lg font-bold text-[#222222]">Photo Zoom Insights</h2>
              <ZoomIn className="w-5 h-5 text-[#5A5187]" />
            </div>
            <p className="text-xs text-[#636466] mb-4">
              Which listing images build the most trust and scrutiny from buyers:
            </p>

            <div className="bg-[#F5F5F3] rounded-2xl p-3.5 mb-4 border border-[#EBE7E4]">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-white shrink-0 border border-[#D0D0D4]">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDNmLidoyKMcRr-U3GOeEJ9LmiRhkkWi4oVS4pp-CulxJm6_DPRfd85oHnG_zBIUccZVmxQYFovT-Ggauyb6vCn65x-2NAApbzqlWwlTdkBnLB7akooEYcy7_ib2PuWPb8_a_VKMBQ2MpkMl3yXlXdX-3GUeGWk6x-c1GFcleb-DQsuzKjLHFuiKLFdittpDArK2-4djhKFw4SsUu0Xrt1W3-7RNMKHdDwSPYALa3z7ygbRf_0wSeSLWw"
                    alt="Neck motif zoom"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-[#5A5187]">PHOTO #2 (NECK MOTIF)</span>
                  <span className="text-xs sm:text-sm font-bold text-[#222222]">65% Zoom Interactions</span>
                  <span className="text-[11px] text-[#636466]">Drove highest buyer dwell time (avg 24s)</span>
                </div>
              </div>
            </div>

            <ul className="space-y-2 text-xs text-[#636466]">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-[#4A5950] shrink-0 mt-0.5" />
                <span><strong>Base Stamp Image:</strong> 42% checked the artisan studio authenticity seal.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-[#4A5950] shrink-0 mt-0.5" />
                <span><strong>Scale Reference Photo:</strong> High zoom on hands holding vase to judge dimensions.</span>
              </li>
            </ul>
          </div>

          <div className="mt-5 pt-4 border-t border-[#EBE7E4]">
            <button
              onClick={() => showToast('Studio spin video tool opened in camera upload mode.', 'info')}
              className="w-full py-2.5 px-3 rounded-xl bg-[#F5F5F3] hover:bg-[#EBE7E4] text-[#222222] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Camera className="w-4 h-4" />
              <span>Upload 360° Studio Spin Video</span>
            </button>
          </div>
        </div>

        {/* Customization Demand Insights */}
        <div className="bg-[#FFFFFF] border border-[#EBE7E4] rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base sm:text-lg font-bold text-[#222222]">Artisan Customization Demand</h2>
              <Sparkles className="w-5 h-5 text-[#7D6B21]" />
            </div>
            <p className="text-xs text-[#636466] mb-4">
              Bespoke notes submitted by buyers during checkout for this craft:
            </p>

            <div className="space-y-3">
              {/* Item 1 */}
              <div className="p-3 rounded-2xl bg-[#F5F5F3] border border-[#EBE7E4] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#F4E39E] text-[#272105] flex items-center justify-center">
                    <Paintbrush className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#222222]">Diwali Gold Motifs</h3>
                    <p className="text-[11px] text-[#636466]">Metallic gold acrylic powder highlighting</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-[#222222]">8 requests</span>
                  <span className="block text-[10px] font-semibold text-[#4A5950]">+₹250 Add-on</span>
                </div>
              </div>

              {/* Item 2 */}
              <div className="p-3 rounded-2xl bg-[#F5F5F3] border border-[#EBE7E4] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#C5BEFF] text-[#1E1A2D] flex items-center justify-center">
                    <PenTool className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#222222]">Family Dedication</h3>
                    <p className="text-[11px] text-[#636466]">Hand-carved initials & housewarming dates</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-[#222222]">3 requests</span>
                  <span className="block text-[10px] font-semibold text-[#4A5950]">Complimentary</span>
                </div>
              </div>

              {/* Item 3 */}
              <div className="p-3 rounded-2xl bg-[#F5F5F3] border border-[#EBE7E4] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#D3E0D7] text-[#252B28] flex items-center justify-center">
                    <Gift className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#222222]">Festive Jute Gift Wrap</h3>
                    <p className="text-[11px] text-[#636466]">Eco raw jute twine & handmade seed paper</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-[#222222]">7 requests</span>
                  <span className="block text-[10px] font-semibold text-[#4A5950]">+₹120 Add-on</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-[#EBE7E4] flex items-center justify-between text-xs text-[#636466]">
            <span>Total Bespoke Revenue Added:</span>
            <strong className="text-sm font-extrabold text-[#7D6B21]">₹ {bespokeRevenue > 0 ? bespokeRevenue.toLocaleString() : (bespokeRequestsCount * 250).toLocaleString()}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
