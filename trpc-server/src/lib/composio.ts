/**
 * Composio Integration Layer
 * Handles WhatsApp notifications, email, calendar syncing, and automations
 */

export interface ComposioActionResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

export class ComposioClient {
  private apiKey: string;
  private baseUrl: string;
  private whatsappAccountId = '8879612c-3960-449e-835c-5900236a2896';

  constructor() {
    this.apiKey = process.env.COMPOSIO_API_KEY || '';
    this.baseUrl = process.env.COMPOSIO_BASE_URL || 'https://backend.composio.dev/api/v2';

    if (!this.apiKey) {
      console.warn('[Composio] API key not configured');
    }
  }

  /**
   * Execute Composio action
   */
  private async executeAction(
    actionSlug: string,
    params: Record<string, unknown>,
    accountId?: string
  ): Promise<ComposioActionResult> {
    if (!this.apiKey) {
      return { success: false, error: 'Composio not configured' };
    }

    try {
      console.log(`[Composio] Executing: ${actionSlug}`, params);
      const requestBody: Record<string, unknown> = {
        input: params,
      };

      // Use specific account ID for WhatsApp actions
      if (actionSlug.includes('whatsapp')) {
        requestBody.connectedAccountId = accountId || this.whatsappAccountId;
        console.log(`[Composio] Using WhatsApp Account ID: ${requestBody.connectedAccountId}`);
      }

      const response = await fetch(`${this.baseUrl}/actions/${actionSlug}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`[Composio] Error ${response.status}: ${error}`);
        return { success: false, error: `API error: ${response.status}` };
      }

      const data = await response.json();
      console.log(`[Composio] Success: ${actionSlug}`);
      return { success: true, data };
    } catch (error) {
      console.error(`[Composio] Exception:`, error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Send WhatsApp message
   * Critical for Costa Rica market (95% WhatsApp penetration)
   */
  async sendWhatsAppMessage(
    phoneNumber: string,
    message: string,
    templateName?: string
  ): Promise<ComposioActionResult> {
    return this.executeAction('whatsapp_send_message', {
      phone_number: phoneNumber,
      message: message,
      template_name: templateName,
    });
  }

  /**
   * Send WhatsApp notification to multiple numbers
   */
  async sendWhatsAppBatch(
    phoneNumbers: string[],
    message: string
  ): Promise<ComposioActionResult[]> {
    return Promise.all(
      phoneNumbers.map((phone) => this.sendWhatsAppMessage(phone, message))
    );
  }

  /**
   * Send email via Composio
   */
  async sendEmail(
    to: string,
    subject: string,
    body: string,
    cc?: string[]
  ): Promise<ComposioActionResult> {
    return this.executeAction('gmail_send_email', {
      to: to,
      subject: subject,
      body: body,
      cc: cc,
    });
  }

  /**
   * Create Google Calendar event
   */
  async createCalendarEvent(
    title: string,
    startTime: string,
    endTime: string,
    attendeeEmails?: string[]
  ): Promise<ComposioActionResult> {
    return this.executeAction('google_calendar_create_event', {
      summary: title,
      start_time: startTime,
      end_time: endTime,
      attendees: attendeeEmails,
    });
  }

  /**
   * Property viewing reminder (24h before)
   */
  async sendViewingReminder(
    phoneNumber: string,
    propertyTitle: string,
    viewingTime: string
  ): Promise<ComposioActionResult> {
    const message = `📍 Reminder: Viewing scheduled for ${propertyTitle}\n⏰ Time: ${viewingTime}\n\nPlease confirm or reschedule.`;
    return this.sendWhatsAppMessage(phoneNumber, message);
  }

  /**
   * Job matched notification (30 seconds after posting)
   */
  async sendJobMatchedNotification(
    phoneNumber: string,
    jobTitle: string,
    matchCount: number
  ): Promise<ComposioActionResult> {
    const message = `✨ Great news! ${matchCount} provider(s) matched your job:\n"${jobTitle}"\n\nTap to view profiles and hire.`;
    return this.sendWhatsAppMessage(phoneNumber, message);
  }

  /**
   * Invoice generation and email
   */
  async generateAndSendInvoice(
    toEmail: string,
    invoiceData: {
      invoiceId: string;
      amount: number;
      date: string;
      items: Array<{ description: string; qty: number; price: number }>;
    }
  ): Promise<ComposioActionResult> {
    const itemsHtml = invoiceData.items
      .map(
        (item) =>
          `<tr><td>${item.description}</td><td>${item.qty}</td><td>$${item.price}</td></tr>`
      )
      .join('');

    const body = `
      <h2>Invoice #${invoiceData.invoiceId}</h2>
      <table>
        <thead><tr><th>Item</th><th>Qty</th><th>Price</th></tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <h3>Total: $${invoiceData.amount}</h3>
      <p>Date: ${invoiceData.date}</p>
    `;

    return this.sendEmail(toEmail, `Invoice ${invoiceData.invoiceId}`, body);
  }

  /**
   * Get connected apps/accounts
   */
  async getConnectedApps(): Promise<{ connected: string[]; available: string[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/connectedAccounts`, {
        headers: { 'x-api-key': this.apiKey },
      });

      if (!response.ok) {
        console.error(`[Composio] Failed to fetch apps: ${response.status}`);
        return { connected: [], available: [] };
      }

      const data = await response.json();
      const items = Array.isArray(data?.items) ? data.items : [];
      const connected = items.map((item: any) => item.appName || 'unknown');

      return {
        connected,
        available: ['whatsapp', 'gmail', 'google_calendar', 'google_sheets', 'google_maps'],
      };
    } catch (error) {
      console.error('[Composio] Error fetching apps:', error);
      return { connected: [], available: [] };
    }
  }
}

// Export singleton instance
export const composio = new ComposioClient();
