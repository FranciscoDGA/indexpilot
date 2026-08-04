import { Priority } from '@/types/intelligence';

export type NotificationChannel = 'in_app' | 'email' | 'webhook';

export interface NotificationPayload {
  userId: string;
  publicationId: string;
  type: string;
  title: string;
  message: string;
  priority: Priority;
  channels: NotificationChannel[];
  metadata?: Record<string, any>;
}

export interface AlertPreferences {
  userId: string;
  emailEnabled: boolean;
  emailFrequency: 'immediate' | 'daily' | 'weekly';
  inAppEnabled: boolean;
  criticalOnly: boolean;
  doNotDisturbStart?: string; // HH:mm format
  doNotDisturbEnd?: string;   // HH:mm format
}

class NotificationService {
  private queue: NotificationPayload[] = [];
  private isProcessing = false;

  async sendNotification(payload: NotificationPayload): Promise<void> {
    this.queue.push(payload);
    await this.processQueue();
  }

  async sendNotificationToUser(
    userId: string,
    publicationId: string,
    type: string,
    title: string,
    message: string,
    priority: Priority,
    metadata?: Record<string, any>
  ): Promise<void> {
    const preferences = await this.getPreferences(userId);

    if (!this.shouldNotify(preferences, priority)) {
      return;
    }

    const channels = this.getChannels(preferences, priority);

    const payload: NotificationPayload = {
      userId,
      publicationId,
      type,
      title,
      message,
      priority,
      channels,
      metadata,
    };

    await this.sendNotification(payload);
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.queue.length > 0) {
        const notification = this.queue.shift();
        if (notification) {
          await this.dispatchNotification(notification);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async dispatchNotification(payload: NotificationPayload): Promise<void> {
    const promises: Promise<void>[] = [];

    if (payload.channels.includes('in_app')) {
      promises.push(this.sendInAppNotification(payload));
    }

    if (payload.channels.includes('email')) {
      promises.push(this.sendEmailNotification(payload));
    }

    if (payload.channels.includes('webhook')) {
      promises.push(this.sendWebhookNotification(payload));
    }

    await Promise.allSettled(promises);
  }

  private async sendInAppNotification(payload: NotificationPayload): Promise<void> {
    try {
      await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: payload.userId,
          publication_id: payload.publicationId,
          type: payload.type,
          title: payload.title,
          message: payload.message,
          priority: payload.priority,
          channel: 'in_app',
        }),
      });
    } catch (error) {
      console.error('Erro ao enviar notificação in-app:', error);
    }
  }

  private async sendEmailNotification(payload: NotificationPayload): Promise<void> {
    try {
      await fetch('/api/notifications/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: payload.userId,
          publication_id: payload.publicationId,
          type: payload.type,
          title: payload.title,
          message: payload.message,
          priority: payload.priority,
          metadata: payload.metadata,
        }),
      });
    } catch (error) {
      console.error('Erro ao enviar notificação por email:', error);
    }
  }

  private async sendWebhookNotification(payload: NotificationPayload): Promise<void> {
    try {
      await fetch('/api/webhooks/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('Erro ao despachar webhook:', error);
    }
  }

  private shouldNotify(preferences: AlertPreferences, priority: Priority): boolean {
    if (preferences.criticalOnly && priority !== 'CRITICAL') {
      return false;
    }

    if (!preferences.inAppEnabled && !preferences.emailEnabled) {
      return false;
    }

    if (!this.isOutsideDoNotDisturb(preferences)) {
      return false;
    }

    return true;
  }

  private getChannels(preferences: AlertPreferences, priority: Priority): NotificationChannel[] {
    const channels: NotificationChannel[] = [];

    if (preferences.inAppEnabled) {
      channels.push('in_app');
    }

    if (preferences.emailEnabled && this.shouldEmailNotify(preferences, priority)) {
      channels.push('email');
    }

    return channels;
  }

  private shouldEmailNotify(preferences: AlertPreferences, priority: Priority): boolean {
    if (preferences.emailFrequency === 'immediate') {
      return true;
    }

    if (preferences.emailFrequency === 'daily' && priority === 'CRITICAL') {
      return true;
    }

    return false;
  }

  private isOutsideDoNotDisturb(preferences: AlertPreferences): boolean {
    if (!preferences.doNotDisturbStart || !preferences.doNotDisturbEnd) {
      return true;
    }

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);

    if (preferences.doNotDisturbStart < preferences.doNotDisturbEnd) {
      return currentTime < preferences.doNotDisturbStart || currentTime > preferences.doNotDisturbEnd;
    } else {
      return currentTime < preferences.doNotDisturbStart && currentTime > preferences.doNotDisturbEnd;
    }
  }

  private async getPreferences(userId: string): Promise<AlertPreferences> {
    try {
      const response = await fetch(`/api/alert-preferences?user_id=${userId}`);
      if (response.ok) {
        return response.json();
      }
    } catch (error) {
      console.error('Erro ao buscar preferências:', error);
    }

    return this.getDefaultPreferences(userId);
  }

  private getDefaultPreferences(userId: string): AlertPreferences {
    return {
      userId,
      emailEnabled: true,
      emailFrequency: 'immediate',
      inAppEnabled: true,
      criticalOnly: false,
    };
  }
}

export const notificationService = new NotificationService();
