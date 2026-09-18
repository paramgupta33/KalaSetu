import React, { useState } from 'react';
import { TrendingUp, ChevronDown } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface DataPoint {
  date: string;
  amount: number;
  x: number;
  y: number;
}

export const SalesSplineChart: React.FC<{ compact?: boolean; productId?: string }> = ({
  compact = false,
  productId,
}) => {
  const { t, language, orders, products, artisanAnalytics, salesPeriod, setSalesPeriod } = useApp();
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);

  // 1. Calculate the start date threshold based on selected salesPeriod
  const numDays = salesPeriod === '7d' ? 7 : salesPeriod === '90d' ? 90 : salesPeriod === 'all' ? 365 : 30;
  const now = new Date();
  const startDate = new Date();
  startDate.setDate(now.getDate() - numDays);
  startDate.setHours(0, 0, 0, 0);

  // 2. Verified calculation of Total Revenue for the selected period (matching Analytics KPI card)
  const totalRevenue = React.useMemo(() => {
    if (productId) {
      const matchingItem = artisanAnalytics?.products?.find((p) => p.product_id === productId);
      if (matchingItem) {
        return Number(matchingItem.revenue);
      }
      if (artisanAnalytics?.total_revenue !== undefined) {
        return Number(artisanAnalytics.total_revenue);
      }

      const prod = products.find((p) => p.id === productId);
      const matchingOrders = (orders || []).filter((o) => {
        if ((o.status as string) === 'cancelled') return false;
        if (salesPeriod !== 'all') {
          const dateStr = o.created_at || o.createdAt || (o as any).date;
          if (dateStr) {
            const d = new Date(dateStr);
            if (!isNaN(d.getTime()) && d < startDate) return false;
          }
        }
        if (o.productId === productId) return true;
        if (o.items && Array.isArray(o.items)) {
          return o.items.some(
            (it: any) =>
              it.product?.id === productId ||
              it.product_id === productId ||
              it.product?.sku === prod?.sku
          );
        }
        return false;
      });

      return matchingOrders.reduce((sum, ord) => {
        if (ord.items && Array.isArray(ord.items) && ord.items.length > 0) {
          const itm = ord.items.find(
            (it: any) =>
              it.product?.id === productId ||
              it.product_id === productId ||
              it.product?.sku === prod?.sku
          );
          const unitPr = Number(itm?.unitPrice || itm?.price || itm?.product?.price || prod?.price || 0);
          return sum + unitPr * (itm?.quantity || 1);
        }
        return sum + (Number(ord.totalAmount) || Number(prod?.price || 0) * (ord.quantity || 1));
      }, 0);
    }

    if (artisanAnalytics?.total_revenue !== undefined) {
      return Number(artisanAnalytics.total_revenue);
    }

    const periodOrders = (orders || []).filter((o) => {
      if ((o.status as string) === 'cancelled') return false;
      if (salesPeriod !== 'all') {
        const dateStr = o.created_at || o.createdAt || (o as any).date;
        if (dateStr) {
          const d = new Date(dateStr);
          if (!isNaN(d.getTime()) && d < startDate) return false;
        }
      }
      return true;
    });

    return periodOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  }, [artisanAnalytics, orders, products, productId, salesPeriod, startDate]);

  // 3. Build exact daily time-series data points from real orders and backend metrics
  const dataPoints: DataPoint[] = React.useMemo(() => {
    const backendSeries = artisanAnalytics?.time_series;

    // Use backend time-series directly if present (ensures 100% data sync with Total Revenue)
    if (Array.isArray(backendSeries) && backendSeries.length > 0) {
      const rawBuckets = backendSeries.map((pt) => ({
        date: pt.date,
        amount: Number(pt.revenue) || Number(pt.amount) || 0,
      }));

      let sampled = rawBuckets;
      if (rawBuckets.length > 35) {
        const step = Math.ceil(rawBuckets.length / 30);
        sampled = rawBuckets.filter((_, idx) => idx % step === 0 || idx === rawBuckets.length - 1);
      }

      const maxVal = Math.max(...sampled.map((b) => b.amount), 1);
      const startX = 25;
      const endX = 475;
      const stepX = sampled.length > 1 ? (endX - startX) / (sampled.length - 1) : 0;

      return sampled.map((pt, idx) => {
        const x = startX + idx * stepX;
        const y = maxVal > 0 && pt.amount > 0
          ? Math.round(145 - (pt.amount / maxVal) * 105)
          : 145;

        return {
          date: pt.date,
          amount: pt.amount,
          x,
          y,
        };
      });
    }

    const numPoints = salesPeriod === '7d' ? 7 : salesPeriod === '90d' ? 18 : salesPeriod === 'all' ? 12 : 30;
    const stepDays = salesPeriod === '7d' ? 1 : salesPeriod === '90d' ? 5 : salesPeriod === 'all' ? 30 : 1;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const rawBuckets: { date: string; amount: number; fullDate: string }[] = [];

    const relevantOrders = (orders || []).filter((o) => {
      if ((o.status as string) === 'cancelled') return false;
      if (!productId) return true;
      return (
        o.productId === productId ||
        o.items?.some((it: any) => it.product_id === productId || it.product?.id === productId)
      );
    });

    for (let i = numPoints - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i * stepDays);
      const dateKey = d.toISOString().split('T')[0];
      const displayLabel = `${d.getDate()} ${monthNames[d.getMonth()]}`;

      // Check real matching orders for this date
      const dayRev = relevantOrders
        .filter((o) => {
          const ordDate = (o.created_at || o.createdAt || (o as any).date || '').split('T')[0];
          return ordDate === dateKey;
        })
        .reduce((sum, ord) => {
          if (productId && ord.items && Array.isArray(ord.items) && ord.items.length > 0) {
            const itm = ord.items.find(
              (it: any) => it.product_id === productId || it.product?.id === productId
            );
            const unitPr = Number(itm?.unitPrice || itm?.price || itm?.product?.price || 0);
            return sum + unitPr * (itm?.quantity || 1);
          }
          return sum + (Number(ord.totalAmount) || 0);
        }, 0);

      rawBuckets.push({ date: displayLabel, amount: dayRev, fullDate: dateKey });
    }

    const maxVal = Math.max(...rawBuckets.map((b) => b.amount), 1);
    const startX = 25;
    const endX = 475;
    const stepX = rawBuckets.length > 1 ? (endX - startX) / (rawBuckets.length - 1) : 0;

    return rawBuckets.map((pt, idx) => {
      const x = startX + idx * stepX;
      const y = maxVal > 0 && pt.amount > 0
        ? Math.round(145 - (pt.amount / maxVal) * 105)
        : 145;

      return {
        date: pt.date,
        amount: pt.amount,
        x,
        y,
      };
    });
  }, [artisanAnalytics?.time_series, orders, salesPeriod, productId]);

  // Generate SVG path for smooth bezier curve connecting points
  const { pathD, areaD } = React.useMemo(() => {
    if (dataPoints.length === 0) return { pathD: '', areaD: '' };
    if (dataPoints.length === 1) {
      const p = dataPoints[0];
      return {
        pathD: `M ${p.x} ${p.y} L ${p.x + 1} ${p.y}`,
        areaD: `M ${p.x} ${p.y} L ${p.x + 1} ${p.y} L ${p.x + 1} 175 L ${p.x} 175 Z`,
      };
    }

    let d = `M ${dataPoints[0].x} ${dataPoints[0].y}`;
    for (let i = 0; i < dataPoints.length - 1; i++) {
      const p0 = dataPoints[i];
      const p1 = dataPoints[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) / 2;
      const cp1y = p0.y;
      const cp2x = p0.x + (p1.x - p0.x) / 2;
      const cp2y = p1.y;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }

    const first = dataPoints[0];
    const last = dataPoints[dataPoints.length - 1];
    const area = `${d} L ${last.x} 175 L ${first.x} 175 Z`;
    return { pathD: d, areaD: area };
  }, [dataPoints]);

  // Choose 5-7 evenly spaced milestone indices for clean, non-overlapping X-axis labels
  const milestoneLabels = React.useMemo(() => {
    if (dataPoints.length <= 7) return dataPoints;
    const count = 6;
    const step = (dataPoints.length - 1) / (count - 1);
    const indices = new Set<number>();
    for (let i = 0; i < count; i++) {
      indices.add(Math.round(i * step));
    }
    return dataPoints.filter((_, idx) => indices.has(idx));
  }, [dataPoints]);

  const periodLabel = salesPeriod === '7d'
    ? 'Last 7 Days'
    : salesPeriod === '30d'
    ? 'This Month'
    : salesPeriod === '90d'
    ? 'This Quarter'
    : 'All Time';

  return (
    <div className="bg-[#F4E39E] rounded-3xl p-5 sm:p-7 shadow-xs border border-[#DFCD7E]/70 relative overflow-hidden flex flex-col justify-between select-none">
      {/* Ambient background blur blobs */}
      <div className="absolute -top-10 -right-10 w-44 h-44 bg-white/30 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-white/40 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex justify-between items-start mb-2 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-semibold text-[#272105]/80 uppercase tracking-wide">
              Revenue Over Time
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#272105]/10 text-[#272105]">
              {periodLabel}
            </span>
          </div>
          <p className="text-2xl sm:text-4xl font-extrabold text-[#272105] mt-1 tracking-tight">
            ₹ {totalRevenue.toLocaleString()}
          </p>
        </div>

        {/* Period Selector Button */}
        <div className="relative">
          <button
            onClick={() => {
              const next: Record<string, '7d' | '30d' | '90d' | 'all'> = {
                '7d': '30d',
                '30d': '90d',
                '90d': 'all',
                all: '7d',
              };
              setSalesPeriod(next[salesPeriod] || '30d');
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-[#272105] bg-white/50 hover:bg-white/70 px-3.5 py-1.5 rounded-full backdrop-blur-sm transition-colors shadow-2xs border border-white/40 cursor-pointer"
            id="btn-sales-period"
          >
            <span>{periodLabel}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#7D6B21]" />
          </button>
        </div>
      </div>

      {/* Trend Indicator */}
      <div className="flex items-center gap-1.5 mb-3 relative z-10">
        <TrendingUp className="w-4 h-4 text-[#7D6B21]" />
        <span className="text-xs font-bold text-[#7D6B21]">
          {totalRevenue > 0 ? `${periodLabel} Revenue Tracked` : '0 sales recorded this period'}
        </span>
      </div>

      {/* Interactive Spline Graph */}
      <div className="w-full h-44 sm:h-52 relative z-10 mt-1">
        {hoveredPoint && (
          <div
            className="absolute z-20 px-2.5 py-1 rounded-xl bg-[#2C2C2C] text-white text-[11px] font-bold shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full transition-all"
            style={{
              left: `${(hoveredPoint.x / 500) * 100}%`,
              top: `${(hoveredPoint.y / 180) * 100}%`,
              marginTop: '-8px',
            }}
          >
            ₹{hoveredPoint.amount.toLocaleString()} ({hoveredPoint.date})
          </div>
        )}

        <svg className="w-full h-full overflow-visible" viewBox="0 0 500 180" preserveAspectRatio="none">
          <defs>
            <linearGradient id="salesSplineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#7D6B21" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#F4E39E" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Area Fill */}
          <path
            d={areaD}
            fill="url(#salesSplineGrad)"
          />

          {/* Spline Stroke */}
          <path
            d={pathD}
            fill="none"
            stroke="#7D6B21"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Data Points */}
          {dataPoints.map((pt, idx) => (
            <g
              key={idx}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredPoint(pt)}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <circle
                cx={pt.x}
                cy={pt.y}
                r={hoveredPoint?.date === pt.date ? '7' : '5'}
                fill="#7D6B21"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                className="transition-all"
              />
            </g>
          ))}
        </svg>
      </div>

      {/* X-Axis Milestone Labels (clean, evenly spaced, non-overlapping) */}
      <div className="flex justify-between items-center text-xs font-semibold text-[#272105]/70 mt-2 px-1 relative z-10">
        {milestoneLabels.map((pt, idx) => (
          <span key={idx} className="whitespace-nowrap">{pt.date}</span>
        ))}
      </div>
    </div>
  );
};
