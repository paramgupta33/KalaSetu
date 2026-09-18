import { BusinessEvent, BusinessEventType, AppNotification } from '../types';

/**
 * Event-Driven Notification Service
 *
 * Implements business event translation, deduplication, and suppression rules.
 * Structured so real backend WebSocket/REST notifications can hook in seamlessly
 * without requiring any UI redesign.
 */

// In-memory set of processed event IDs to prevent duplicate notifications
// across re-renders or repeated state updates (idempotency guard)
const processedEventIds = new Set<string>();

// Cooldown tracker for identical toast messages (prevents toast flooding)
const recentToastMessages = new Map<string, number>();

export const NotificationService = {
  /**
   * Generates a deterministic event ID for idempotent event handling.
   * e.g., createEventId('order', 'ORD-8492', 'placed') -> 'order_ORD-8492_placed'
   */
  createEventId: (entityType: string, entityId: string, action: string): string => {
    return `${entityType}_${entityId}_${action}`;
  },

  /**
   * Checks if an event has already been processed.
   */
  isEventProcessed: (eventId: string): boolean => {
    return processedEventIds.has(eventId);
  },

  /**
   * Marks an event ID as processed.
   */
  markEventProcessed: (eventId: string): void => {
    processedEventIds.add(eventId);
  },

  /**
   * Determines if a toast message should be suppressed due to rapid duplication.
   * Default cooldown is 3000ms.
   */
  shouldSuppressToast: (message: string, cooldownMs: number = 3000): boolean => {
    const now = Date.now();
    const lastTimestamp = recentToastMessages.get(message);
    if (lastTimestamp && now - lastTimestamp < cooldownMs) {
      return true;
    }
    recentToastMessages.set(message, now);

    // Prune stale entries
    if (recentToastMessages.size > 50) {
      for (const [msg, ts] of recentToastMessages.entries()) {
        if (now - ts > 15000) {
          recentToastMessages.delete(msg);
        }
      }
    }
    return false;
  },

  /**
   * Creates an AppNotification object from a business event for persistent storage.
   */
  createPersistentNotification: (event: BusinessEvent): AppNotification => {
    return {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      eventId: event.eventId,
      type: event.type,
      message: event.message,
      severity: event.severity || 'info',
      timestamp: event.timestamp || Date.now(),
      isRead: false,
      targetRole: event.targetRole || 'all',
      entityId: event.entityId,
    };
  },

  /**
   * Reset processed events (useful during testing or logout).
   */
  reset: (): void => {
    processedEventIds.clear();
    recentToastMessages.clear();
  },
};
