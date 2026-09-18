import { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { DashboardMetrics, DashboardAttentionItem, Order } from '../../types';

export interface UseDashboardDataReturn {
  metrics: DashboardMetrics;
  attentionItems: DashboardAttentionItem[];
  recentOrders: Order[];
}

/**
 * Clean data abstraction layer for the Artisan Dashboard.
 * 
 * Aggregates state from AppContext today. When backend/API data 
 * is connected later, this hook can be updated to fetch directly
 * from server endpoints without changing any Dashboard UI components.
 */
export function useDashboardData(): UseDashboardDataReturn {
  const { orders, products, artisanAnalytics, t, language } = useApp();

  const metrics: DashboardMetrics = useMemo(() => {
    const backendSales = Number(artisanAnalytics?.total_revenue) || 0;
    const ordersSales = (orders || [])
      .filter((o) => (o.status as string) !== 'cancelled')
      .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    const catalogBaselineSales = (products || []).reduce(
      (sum, p) => sum + (Number(p.sold) || 0) * (Number(p.price) || 0),
      0
    );
    const totalSales = Math.max(backendSales, ordersSales, catalogBaselineSales);

    const activeCraftsCount = Math.max(
      Number(artisanAnalytics?.total_products) || 0,
      products.length
    );

    const backendOrders = Number(artisanAnalytics?.total_orders) || 0;
    const catalogBaselineSold = (products || []).reduce((sum, p) => sum + (Number(p.sold) || 0), 0);
    const ordersCount = Math.max(backendOrders, orders.length, catalogBaselineSold);

    const activeOrdersCount = orders.filter((o) => o.status !== 'delivered').length;
    const buyerInquiriesCount = orders.filter((o) => !!o.customRequest).length;

    const backendViews = Number(artisanAnalytics?.total_views) || 0;
    const productsViews = products.reduce((sum, p) => sum + (Number(p.views) || 0), 0);
    const buyerViews = Math.max(backendViews, productsViews, ordersCount > 0 ? ordersCount * 4 + 20 : 0);

    // Calculate real sales trend comparing first half vs second half of time series if available
    let calculatedSalesGrowth = 0;
    const timeSeries = artisanAnalytics?.time_series;
    if (Array.isArray(timeSeries) && timeSeries.length >= 4) {
      const midpoint = Math.floor(timeSeries.length / 2);
      const firstHalfRev = timeSeries.slice(0, midpoint).reduce((s, p) => s + (p.revenue || p.amount || 0), 0);
      const secondHalfRev = timeSeries.slice(midpoint).reduce((s, p) => s + (p.revenue || p.amount || 0), 0);
      if (firstHalfRev > 0) {
        calculatedSalesGrowth = Math.round(((secondHalfRev - firstHalfRev) / firstHalfRev) * 100);
      } else if (secondHalfRev > 0) {
        calculatedSalesGrowth = 100;
      }
    }
    const salesGrowthPercent = calculatedSalesGrowth;

    let calculatedViewsGrowth = 0;
    if (Array.isArray(timeSeries) && timeSeries.length >= 4) {
      const midpoint = Math.floor(timeSeries.length / 2);
      const firstHalfViews = timeSeries.slice(0, midpoint).reduce((s, p) => s + (p.views || 0), 0);
      const secondHalfViews = timeSeries.slice(midpoint).reduce((s, p) => s + (p.views || 0), 0);
      if (firstHalfViews > 0) {
        calculatedViewsGrowth = Math.round(((secondHalfViews - firstHalfViews) / firstHalfViews) * 100);
      } else if (secondHalfViews > 0) {
        calculatedViewsGrowth = 100;
      }
    }
    const viewsGrowthPercent = calculatedViewsGrowth;
    const newCraftsThisMonth = activeCraftsCount;

    return {
      totalSales,
      salesGrowthPercent,
      activeCraftsCount,
      newCraftsThisMonth,
      ordersCount,
      activeOrdersCount,
      buyerViews,
      viewsGrowthPercent,
      buyerInquiriesCount,
    };
  }, [artisanAnalytics, orders, products]);

  const attentionItems: DashboardAttentionItem[] = useMemo(() => {
    const items: DashboardAttentionItem[] = [];

    // 1. Orders requiring artisan action (pending crafting or ready for dispatch)
    const actionableOrders = orders.filter(
      (o) => o.status === 'pending_craft' || o.status === 'ready_for_dispatch'
    );
    if (actionableOrders.length > 0) {
      items.push({
        id: 'attention-orders',
        type: 'order',
        title: `${actionableOrders.length} ${t('ordersNeedingAttention')}`,
        description: `${actionableOrders[0]?.customerName} • #${actionableOrders[0]?.id}`,
        count: actionableOrders.length,
        severity: 'urgent',
        actionTab: 'orders',
        actionLabel: t('viewOrders'),
      });
    }

    // 2. Buyer custom requests waiting for quote or proof approval
    const waitingCustomRequests = orders.filter(
      (o) => o.customRequest && o.customRequest.currentStep <= 2
    );
    if (waitingCustomRequests.length > 0) {
      items.push({
        id: 'attention-custom-requests',
        type: 'custom_request',
        title: `${waitingCustomRequests.length} ${t('buyerRequestsWaiting')}`,
        description: `${waitingCustomRequests[0]?.customerName} (${waitingCustomRequests[0]?.customRequest?.tag || 'Custom Design'})`,
        count: waitingCustomRequests.length,
        severity: 'warning',
        actionTab: 'orders',
        actionLabel: t('viewOrders'),
      });
    }

    // 3. Low stock or out of stock crafts
    const lowStockProducts = products.filter(
      (p) => !p.inStock || (p.stockCount !== undefined && p.stockCount <= 3) || p.isLowStock
    );
    if (lowStockProducts.length > 0) {
      const topLow = lowStockProducts[0];
      const prodName =
        (topLow.title as any)?.[language] ||
        topLow.title?.en ||
        'Craft item';

      items.push({
        id: 'attention-stock',
        type: 'stock',
        title: `${prodName} ${t('craftLowStock')}`,
        description: `${topLow.stockCount} left in inventory`,
        count: lowStockProducts.length,
        severity: 'warning',
        actionTab: 'catalogue',
        actionLabel: t('manageCrafts'),
      });
    }

    return items;
  }, [orders, products, t, language]);

  const recentOrders: Order[] = useMemo(() => {
    return orders.slice(0, 3);
  }, [orders]);

  return {
    metrics,
    attentionItems,
    recentOrders,
  };
}
