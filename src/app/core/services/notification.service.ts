import { Injectable, signal, computed, inject, DestroyRef } from '@angular/core';

/**
 * Notification types for different in-game events
 */
export type NotificationType = 'stat' | 'badge' | 'info' | 'achievement';

/**
 * A game notification to display
 */
export interface GameNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  icon?: string;
  duration: number;
}

/**
 * Service for managing in-game notifications (popups)
 * These are brief, non-blocking notifications that appear and auto-dismiss
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private destroyRef = inject(DestroyRef);
  private readonly notifications = signal<GameNotification[]>([]);
  private notificationCounter = 0;
  private timeouts = new Map<string, ReturnType<typeof setTimeout>>();

  constructor() {
    // Cleanup all timeouts on destroy
    this.destroyRef.onDestroy(() => {
      this.timeouts.forEach((timeout) => clearTimeout(timeout));
      this.timeouts.clear();
    });
  }

  // Current notification to display (first in queue)
  readonly current = computed(() => this.notifications()[0] ?? null);

  // Whether a notification is showing
  readonly hasNotification = computed(() => this.notifications().length > 0);

  /**
   * Show a stat notification (e.g., "4+ years experience")
   */
  showStat(title: string, message: string, icon?: string): void {
    this.show({
      type: 'stat',
      title,
      message,
      icon,
      duration: 2500,
    });
  }

  /**
   * Show a badge notification (e.g., "Angular collected!")
   */
  showBadge(title: string, message: string, icon?: string): void {
    this.show({
      type: 'badge',
      title,
      message,
      icon,
      duration: 2000,
    });
  }

  /**
   * Show an info notification
   */
  showInfo(title: string, message: string, duration = 3000): void {
    this.show({
      type: 'info',
      title,
      message,
      duration,
    });
  }

  /**
   * Show an achievement notification (longer duration)
   */
  showAchievement(title: string, message: string, icon?: string): void {
    this.show({
      type: 'achievement',
      title,
      message,
      icon,
      duration: 4000,
    });
  }

  /**
   * Generic show notification
   */
  private show(notification: Omit<GameNotification, 'id'>): void {
    const id = `notification-${++this.notificationCounter}`;
    const fullNotification: GameNotification = { ...notification, id };

    this.notifications.update((list) => [...list, fullNotification]);

    // Auto-dismiss after duration (with tracked timeout)
    const timeout = setTimeout(() => this.dismiss(id), notification.duration);
    this.timeouts.set(id, timeout);
  }

  /**
   * Dismiss a notification by ID
   */
  dismiss(id: string): void {
    // Clear the timeout if it exists
    const timeout = this.timeouts.get(id);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(id);
    }
    this.notifications.update((list) => list.filter((n) => n.id !== id));
  }

  /**
   * Clear all notifications
   */
  clearAll(): void {
    // Clear all timeouts
    this.timeouts.forEach((timeout) => clearTimeout(timeout));
    this.timeouts.clear();
    this.notifications.set([]);
  }
}
