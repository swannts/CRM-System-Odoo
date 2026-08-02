import { config } from '../../config/env.js';

export class OutlookAuthService {
  private clientId: string;
  private redirectUri: string;

  constructor() {
    this.clientId = config.outlook.clientId || '';
    this.redirectUri = process.env.OUTLOOK_REDIRECT_URI || 'http://localhost:3000/auth/callback/outlook';
  }

  generateAuthUrl(orgId: string, userId: string) {
    const scopes = [
      'offline_access',
      'User.Read',
      'Mail.Read',
      'Mail.ReadWrite',
      'Mail.Send'
    ];

    const state = Buffer.from(JSON.stringify({ orgId, userId, provider: 'outlook' })).toString('base64');

    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      response_mode: 'query',
      scope: scopes.join(' '),
      state: state,
      prompt: 'consent'
    });

    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
  }

  async getToken(code: string) {
    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: config.outlook.clientSecret || '',
      code: code,
      redirect_uri: this.redirectUri,
      grant_type: 'authorization_code'
    });

    const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get Outlook token: ${errorText}`);
    }

    return await response.json();
  }

  async getUserInfo(accessToken: string) {
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get Outlook user info: ${errorText}`);
    }

    return await response.json();
  }

  async sendEmail(
    accessToken: string,
    params: {
      to: string | string[];
      subject: string;
      body: string;
      cc?: string | string[];
      bcc?: string | string[];
      isHtml?: boolean;
    }
  ) {
    const toRecipients = (Array.isArray(params.to) ? params.to : [params.to]).map(email => ({
      emailAddress: { address: email }
    }));

    const ccRecipients = params.cc ? (Array.isArray(params.cc) ? params.cc : [params.cc]).map(email => ({
      emailAddress: { address: email }
    })) : [];

    const bccRecipients = params.bcc ? (Array.isArray(params.bcc) ? params.bcc : [params.bcc]).map(email => ({
      emailAddress: { address: email }
    })) : [];

    const message = {
      message: {
        subject: params.subject,
        body: {
          contentType: params.isHtml ? 'HTML' : 'Text',
          content: params.body
        },
        toRecipients,
        ccRecipients,
        bccRecipients
      },
      saveToSentItems: 'true'
    };

    const sendResponse = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    });

    if (!sendResponse.ok) {
      const errorText = await sendResponse.text();
      throw new Error(`Failed to send email via Outlook API: ${errorText}`);
    }

    return { success: true };
  }

  private async getAccessToken(refreshToken: string) {
    const tokenParams = new URLSearchParams({
      client_id: this.clientId,
      client_secret: config.outlook.clientSecret || '',
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    });

    const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams.toString()
    });

    if (!tokenResponse.ok) {
      const err = await tokenResponse.text();
      throw new Error(`Failed to refresh Outlook token: ${err}`);
    }

    const data = await tokenResponse.json() as any;
    return data;
  }

  async fetchMessages(accessToken: string, lastSyncAt?: Date) {

    let url = 'https://graph.microsoft.com/v1.0/me/messages?$top=100&$select=id,subject,body,bodyPreview,from,toRecipients,ccRecipients,bccRecipients,receivedDateTime,sentDateTime,hasAttachments,categories,conversationId';
    
    if (lastSyncAt) {
      const filter = `receivedDateTime ge ${lastSyncAt.toISOString()}`;
      url += `&$filter=${encodeURIComponent(filter)}`;
    }

    const results: any[] = [];
    while (url) {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Failed to fetch Outlook messages: ${err}`);
      }

      const payload = await response.json() as any;
      const messages = payload.value || [];
      for (const msg of messages) {
        results.push(this.parseOutlookMessage(msg));
      }
      url = payload["@odata.nextLink"] || "";
    }

    return results;
  }

  parseOutlookMessage(msg: any) {
    const labels = msg.categories || [];
    if (msg.parentFolderId) labels.push(msg.parentFolderId);

    const attachmentMetadata = Array.isArray(msg.attachments)
      ? msg.attachments.map((a: any) => ({
          filename: a.name,
          mimeType: a.contentType,
          size: a.size,
          attachmentId: a.id
        }))
      : [];

    return {
      messageId: msg.id,
      threadId: msg.conversationId,
      subject: msg.subject,
      fromName: msg.from?.emailAddress?.name,
      fromEmail: msg.from?.emailAddress?.address,
      toEmails: msg.toRecipients?.map((r: any) => r.emailAddress?.address).filter(Boolean) || [],
      ccEmails: msg.ccRecipients?.map((r: any) => r.emailAddress?.address).filter(Boolean) || [],
      bccEmails: msg.bccRecipients?.map((r: any) => r.emailAddress?.address).filter(Boolean) || [],
      textBody: msg.body?.contentType?.toLowerCase() === 'text' ? msg.body.content : undefined,
      htmlBody: msg.body?.contentType?.toLowerCase() === 'html' ? msg.body.content : undefined,
      snippet: msg.bodyPreview,
      sentAt: msg.sentDateTime ? new Date(msg.sentDateTime) : new Date(),
      receivedAt: msg.receivedDateTime ? new Date(msg.receivedDateTime) : new Date(),
      hasAttachments: !!msg.hasAttachments,
      attachmentCount: attachmentMetadata.length || (msg.hasAttachments ? 1 : 0),
      labels,
      isRead: msg.isRead !== false,
      attachmentMetadata
    };
  }

  async refreshAccessToken(refreshToken: string) {
    const data: any = await this.getAccessToken(refreshToken);
    const accessToken = data?.access_token;
    if (!accessToken) throw new Error("Failed to refresh Outlook access token");
    const nextRefreshToken = data?.refresh_token || refreshToken;
    const expiresAt = data?.expires_in ? new Date(Date.now() + Number(data.expires_in) * 1000) : undefined;
    return { accessToken, refreshToken: nextRefreshToken, expiresAt };
  }
}
