import { google } from 'googleapis';
import { config } from '../../config/env.js';

export class GoogleAuthService {
  private oauth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      config.gmail.clientId,
      config.gmail.clientSecret,
      process.env.GMAIL_REDIRECT_URI || 'http://localhost:3000/auth/callback/google'
    );
  }

  generateAuthUrl(orgId: string, userId: string) {
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.modify'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state: Buffer.from(JSON.stringify({ orgId, userId, provider: 'gmail' })).toString('base64')
    });
  }

  async getToken(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    return tokens;
  }

  async getUserInfo(accessToken: string) {
    const client = new google.auth.OAuth2();
    client.setCredentials({ access_token: accessToken });
    const oauth2 = google.oauth2({ version: 'v2', auth: client });
    const { data } = await oauth2.userinfo.get();
    return data;
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
    const client = new google.auth.OAuth2(
      config.gmail.clientId,
      config.gmail.clientSecret
    );
    client.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth: client });

    const to = Array.isArray(params.to) ? params.to.join(', ') : params.to;

    let messageParts = [
      `To: ${to}`,
      `Subject: ${params.subject}`,
      'MIME-Version: 1.0',
    ];

    if (params.cc) {
      const cc = Array.isArray(params.cc) ? params.cc.join(', ') : params.cc;
      messageParts.push(`Cc: ${cc}`);
    }

    if (params.bcc) {
      const bcc = Array.isArray(params.bcc) ? params.bcc.join(', ') : params.bcc;
      messageParts.push(`Bcc: ${bcc}`);
    }

    const contentType = params.isHtml ? 'text/html; charset="UTF-8"' : 'text/plain; charset="UTF-8"';
    messageParts.push(`Content-Type: ${contentType}`);

    // Empty line separates headers from body
    messageParts.push('');
    messageParts.push(params.body);

    const message = messageParts.join('\r\n');

    // Base64url encode the message
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });

    return res.data;
  }

  async fetchMessages(accessToken: string, lastSyncAt?: Date) {
    const client = new google.auth.OAuth2(
      config.gmail.clientId,
      config.gmail.clientSecret
    );
    client.setCredentials({ access_token: accessToken });
    const gmail = google.gmail({ version: 'v1', auth: client });

    let q = 'label:INBOX';
    if (lastSyncAt) {
      // Gmail 'after' query is in seconds
      const seconds = Math.floor(lastSyncAt.getTime() / 1000);
      q += ` after:${seconds}`;
    }

    const results = [];
    let pageToken: string | undefined;
    do {
      const response = await gmail.users.messages.list({
        userId: 'me',
        q,
        maxResults: 100,
        pageToken
      });
      const messages = response.data.messages || [];
      for (const msg of messages) {
        const details = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id!,
          format: "full"
        });
        results.push(this.parseGmailMessage(details.data));
      }
      pageToken = response.data.nextPageToken || undefined;
    } while (pageToken);

    return results;
  }

  async refreshAccessToken(refreshToken: string) {
    const client = new google.auth.OAuth2(
      config.gmail.clientId,
      config.gmail.clientSecret
    );
    client.setCredentials({ refresh_token: refreshToken });
    const tokenResponse = await client.getAccessToken();
    const accessToken = tokenResponse?.token;
    if (!accessToken) throw new Error("Failed to refresh Gmail access token");
    return { accessToken, refreshToken };
  }

  parseGmailMessage(data: any) {
    const headers = data.payload.headers;
    const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value;

    const fromRaw = getHeader('From') || '';
    const toRaw = getHeader('To') || '';
    
    // Simple regex to extract email from "Name <email@example.com>"
    const emailRegex = /<([^>]+)>/;
    const fromEmail = fromRaw.match(emailRegex)?.[1] || fromRaw;
    const fromName = fromRaw.replace(emailRegex, '').replace(/"/g, '').trim();

    const subject = getHeader('Subject');
    const date = getHeader('Date');
    const ccRaw = getHeader('Cc') || '';
    const bccRaw = getHeader('Bcc') || '';

    let textBody = '';
    let htmlBody = '';

    const attachments: Array<{ filename: string; mimeType?: string; size?: number; attachmentId?: string }> = [];
    const extractBody = (part: any) => {
      if (part.mimeType === 'text/plain' && part.body.data) {
        textBody = Buffer.from(part.body.data, 'base64').toString();
      } else if (part.mimeType === 'text/html' && part.body.data) {
        htmlBody = Buffer.from(part.body.data, 'base64').toString();
      }
      if (part.filename) {
        attachments.push({
          filename: part.filename,
          mimeType: part.mimeType,
          size: part.body?.size,
          attachmentId: part.body?.attachmentId
        });
      }
      if (part.parts) part.parts.forEach(extractBody);
    };

    extractBody(data.payload);

    return {
      messageId: data.id,
      threadId: data.threadId,
      subject,
      fromName,
      fromEmail,
      toEmails: toRaw ? toRaw.split(',').map((s: string) => {
        const m = s.match(emailRegex);
        return m ? m[1] : s.trim();
      }) : [],
      ccEmails: ccRaw ? ccRaw.split(',').map((s: string) => {
        const m = s.match(emailRegex);
        return m ? m[1] : s.trim();
      }) : [],
      bccEmails: bccRaw ? bccRaw.split(',').map((s: string) => {
        const m = s.match(emailRegex);
        return m ? m[1] : s.trim();
      }) : [],
      textBody,
      htmlBody,
      snippet: data.snippet,
      sentAt: date ? new Date(date) : new Date(),
      receivedAt: date ? new Date(date) : new Date(),
      labels: data.labelIds || [],
      isRead: !(data.labelIds || []).includes("UNREAD"),
      hasAttachments: attachments.length > 0,
      attachmentCount: attachments.length,
      attachmentMetadata: attachments
    };
  }
}
