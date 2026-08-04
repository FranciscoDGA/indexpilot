import { EmailTemplate } from '@/lib/templates/emailTemplates';

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
  from?: string;
  replyTo?: string;
}

export interface EmailQueueItem extends EmailPayload {
  id: string;
  createdAt: Date;
  status: 'pending' | 'sent' | 'failed';
  retries: number;
  lastError?: string;
}

class EmailService {
  private queue: Map<string, EmailQueueItem> = new Map();
  private isProcessing = false;
  private readonly maxRetries = 3;
  private readonly retryDelay = 5000;

  async sendEmail(payload: EmailPayload): Promise<string> {
    const id = `email-${Date.now()}-${Math.random()}`;
    const item: EmailQueueItem = {
      ...payload,
      id,
      createdAt: new Date(),
      status: 'pending',
      retries: 0,
    };

    this.queue.set(id, item);
    await this.processQueue();

    return id;
  }

  async sendEmailTemplate(to: string, template: EmailTemplate, replyTo?: string): Promise<string> {
    return this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@indexpilot.app',
      replyTo,
    });
  }

  getQueueStatus(id: string): EmailQueueItem | undefined {
    return this.queue.get(id);
  }

  getQueueStats() {
    const items = Array.from(this.queue.values());
    return {
      total: items.length,
      pending: items.filter(i => i.status === 'pending').length,
      sent: items.filter(i => i.status === 'sent').length,
      failed: items.filter(i => i.status === 'failed').length,
    };
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;

    try {
      const pendingItems = Array.from(this.queue.values())
        .filter(item => item.status === 'pending')
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      for (const item of pendingItems) {
        await this.sendEmailItem(item);

        if (item.retries > this.maxRetries && item.status === 'failed') {
          console.error(`Email ${item.id} failed after ${this.maxRetries} retries`);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async sendEmailItem(item: EmailQueueItem): Promise<void> {
    try {
      if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
        await this.mockSendEmail(item);
      } else if (process.env.SENDGRID_API_KEY) {
        await this.sendViaSendGrid(item);
      } else if (process.env.SMTP_HOST) {
        await this.sendViaSMTP(item);
      } else {
        console.warn('No email provider configured. Email service disabled.');
        item.status = 'failed';
        item.lastError = 'No email provider configured';
        return;
      }

      item.status = 'sent';
      console.log(`Email ${item.id} sent to ${item.to}`);
    } catch (error) {
      item.retries++;
      item.lastError = error instanceof Error ? error.message : 'Unknown error';

      if (item.retries <= this.maxRetries) {
        console.log(`Retrying email ${item.id} (attempt ${item.retries}/${this.maxRetries})`);
        await this.delay(this.retryDelay * item.retries);
        item.status = 'pending';
      } else {
        item.status = 'failed';
        console.error(`Email ${item.id} failed: ${item.lastError}`);
      }
    }
  }

  private async mockSendEmail(item: EmailQueueItem): Promise<void> {
    console.log(`[MOCK] Sending email to ${item.to}`);
    console.log(`[MOCK] Subject: ${item.subject}`);
    console.log(`[MOCK] Preview: ${item.text.substring(0, 100)}...`);

    await this.delay(500);
  }

  private async sendViaSendGrid(item: EmailQueueItem): Promise<void> {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: item.to }],
          },
        ],
        from: { email: item.from || 'noreply@indexpilot.app' },
        reply_to: item.replyTo ? { email: item.replyTo } : undefined,
        subject: item.subject,
        content: [
          {
            type: 'text/plain',
            value: item.text,
          },
          {
            type: 'text/html',
            value: item.html,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`SendGrid error: ${JSON.stringify(error)}`);
    }
  }

  private async sendViaSMTP(item: EmailQueueItem): Promise<void> {
    try {
      const nodemailer = await import('nodemailer');

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });

      await transporter.sendMail({
        from: item.from || 'noreply@indexpilot.app',
        to: item.to,
        replyTo: item.replyTo,
        subject: item.subject,
        text: item.text,
        html: item.html,
      });
    } catch (error) {
      if ((error as any).code === 'ERR_MODULE_NOT_FOUND') {
        throw new Error('nodemailer not installed. Install with: npm install nodemailer');
      }
      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const emailService = new EmailService();
