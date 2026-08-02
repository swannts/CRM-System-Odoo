import test from "node:test";
import assert from "node:assert/strict";
import { EmailSyncService } from "../../src/modules/email-sync/email-sync.service.js";
import { MailService } from "../../src/integrations/email/mail.service.js";
import { GoogleAuthService } from "../../src/integrations/email/google-auth.service.js";
import { OutlookAuthService } from "../../src/integrations/email/outlook-auth.service.js";

test("MailService scopes account by orgId + userId", async () => {
  let capturedWhere: any;
  const db: any = {
    emailAccount: {
      findFirst: async (args: any) => {
        capturedWhere = args.where;
        return null;
      },
    },
    email: { create: async () => ({}) },
  };

  const service = new MailService({ db, decryptFn: () => "token" as any });
  await assert.rejects(
    () =>
      service.sendEmail({
        orgId: "org-1",
        userId: "user-1",
        accountId: "acc-other-user",
        to: "x@example.com",
        subject: "hi",
        body: "body",
      }),
    /No connected email account found/,
  );

  assert.equal(capturedWhere.orgId, "org-1");
  assert.equal(capturedWhere.userId, "user-1");
  assert.equal(capturedWhere.id, "acc-other-user");
});

test("MailService refreshes expired token and sends with refreshed access token", async () => {
  const updates: any[] = [];
  let sentAccessToken = "";
  const db: any = {
    emailAccount: {
      findFirst: async () => ({
        id: "a1",
        orgId: "o1",
        userId: "u1",
        email: "me@example.com",
        provider: "gmail",
        isConnected: true,
        accessToken: "enc-access",
        refreshToken: "enc-refresh",
        expiresAt: new Date(Date.now() - 60_000),
        settings: {},
      }),
      update: async (args: any) => updates.push(args),
    },
    email: { create: async () => ({ id: "e1", messageId: "m1" }) },
  };

  const gmail = {
    refreshAccessToken: async () => ({ accessToken: "new-access", refreshToken: "new-refresh" }),
    sendEmail: async (accessToken: string) => {
      sentAccessToken = accessToken;
      return { id: "m1" };
    },
  } as any;

  const service = new MailService({ db, gmail, decryptFn: (v: string) => (v === "enc-access" ? "old-access" : "old-refresh"), encryptFn: (v: string) => `enc-${v}` as any });
  await service.sendEmail({ orgId: "o1", userId: "u1", to: "x@example.com", subject: "s", body: "b" });

  assert.equal(sentAccessToken, "new-access");
  assert.equal(updates.length, 1);
  assert.equal(updates[0].data.accessToken, "enc-new-access");
});

test("EmailSyncService logs decrypt failure", async () => {
  const updates: any[] = [];
  let syncUpdate: any;
  const db: any = {
    emailAccount: {
      findFirst: async () => ({ id: "a1", orgId: "o1", userId: "u1", email: "u@example.com", provider: "gmail", refreshToken: "enc", accessToken: null, lastSyncAt: null, settings: {} }),
      updateMany: async () => ({ count: 1 }),
      update: async (args: any) => updates.push(args),
    },
    syncLog: {
      create: async () => ({ id: "log1", startedAt: new Date() }),
      update: async (args: any) => {
        syncUpdate = args;
      },
    },
    email: {
      upsert: async () => ({}),
      findFirst: async () => null,
    },
    emailThread: { upsert: async () => ({}) },
  };

  const service = new EmailSyncService({ db, decryptFn: () => "" });
  await assert.rejects(() => service.syncAccountById("a1"), /No refresh token available/);

  assert.equal(updates.at(-1).data.syncStatus, "error");
  assert.equal(syncUpdate.data.status, "error");
});

test("EmailSyncService marks account disconnected when token is revoked", async () => {
  const accountUpdates: any[] = [];
  const db: any = {
    emailAccount: {
      findFirst: async () => ({ id: "a1", orgId: "o1", userId: "u1", email: "u@example.com", provider: "gmail", refreshToken: "enc-r", accessToken: "enc-a", expiresAt: new Date(Date.now() - 60_000), lastSyncAt: null, settings: {} }),
      updateMany: async () => ({ count: 1 }),
      update: async (args: any) => accountUpdates.push(args),
    },
    syncLog: {
      create: async () => ({ id: "log1", startedAt: new Date() }),
      update: async () => ({}),
    },
    email: { upsert: async () => ({}), findFirst: async () => null },
    emailThread: { upsert: async () => ({}) },
  };

  const gmail = {
    refreshAccessToken: async () => {
      throw new Error("invalid_grant");
    },
  } as any;

  const service = new EmailSyncService({ db, gmail, decryptFn: () => "r", encryptFn: (v: string) => v as any });
  await assert.rejects(() => service.syncAccountById("a1"), /invalid_grant/);

  const latest = accountUpdates.at(-1);
  assert.equal(latest.data.isConnected, false);
  assert.equal(latest.data.settings.requiresReconnect, true);
});

test("EmailSyncService upserts deduplicated provider messages and updates sync log", async () => {
  const upserts: any[] = [];
  const threadUpserts: any[] = [];
  const accountUpdates: any[] = [];
  let finalSync: any;

  const db: any = {
    emailAccount: {
      findFirst: async () => ({ id: "a1", orgId: "o1", userId: "u1", email: "me@example.com", provider: "gmail", refreshToken: "enc", accessToken: "enc-a", expiresAt: new Date(Date.now() + 600000), lastSyncAt: null, settings: {} }),
      updateMany: async () => ({ count: 1 }),
      update: async (args: any) => accountUpdates.push(args),
    },
    syncLog: {
      create: async () => ({ id: "log1", startedAt: new Date(Date.now() - 50) }),
      update: async (args: any) => {
        finalSync = args;
      },
    },
    email: {
      upsert: async (args: any) => upserts.push(args),
      findFirst: async () => null,
    },
    emailThread: {
      upsert: async (args: any) => threadUpserts.push(args),
    },
  };

  const gmail = {
    fetchMessages: async () => [
      { messageId: "m1", threadId: "t1", fromEmail: "x@example.com", toEmails: ["me@example.com"], subject: "a" },
      { messageId: "m1", threadId: "t1", fromEmail: "x@example.com", toEmails: ["me@example.com"], subject: "a" },
      { messageId: "m2", threadId: "t2", fromEmail: "me@example.com", toEmails: ["x@example.com"], subject: "b" },
    ],
  } as any;

  const service = new EmailSyncService({ db, decryptFn: () => "access", gmail });
  await service.syncAccountById("a1");

  assert.equal(upserts.length, 2);
  assert.equal(threadUpserts.length, 2);
  assert.equal(finalSync.data.status, "success");
  assert.equal(finalSync.data.emailsSynced, 2);
  assert.equal(finalSync.data.threadsSynced, 2);
  assert.equal(accountUpdates.at(-1).data.syncStatus, "idle");
  assert.ok(accountUpdates.at(-1).data.lastSyncAt instanceof Date);
});

test("EmailSyncService returns scoped sync logs and status", async () => {
  const db: any = {
    emailAccount: {
      findFirst: async () => ({ id: "a1" }),
      count: async ({ where }: any) => {
        if (where.syncStatus === "syncing") return 1;
        if (where.syncStatus === "error") return 2;
        if (where.isConnected) return 3;
        return 4;
      },
    },
    syncLog: {
      findMany: async () => [{ id: "l1", status: "success" }],
    },
  };
  const service = new EmailSyncService({ db });
  const logs = await service.getAccountSyncLogs("a1", { orgId: "o1", userId: "u1" }, 5);
  const status = await service.getSyncStatus({ orgId: "o1", userId: "u1" });

  assert.equal(logs.length, 1);
  assert.equal(status.totalAccounts, 4);
  assert.equal(status.connectedAccounts, 3);
  assert.equal(status.syncingAccounts, 1);
  assert.equal(status.errorAccounts, 2);
});

test("Gmail parser extracts thread/message and attachments", () => {
  const service = new GoogleAuthService();
  const parsed = service.parseGmailMessage({
    id: "m1",
    threadId: "t1",
    snippet: "hello",
    labelIds: ["INBOX"],
    payload: {
      headers: [
        { name: "From", value: "Jane <jane@example.com>" },
        { name: "To", value: "Me <me@example.com>" },
        { name: "Subject", value: "Sub" },
      ],
      parts: [
        { mimeType: "text/plain", body: { data: Buffer.from("body").toString("base64") } },
        { filename: "a.pdf", mimeType: "application/pdf", body: { attachmentId: "att1", size: 42 } },
      ],
    },
  });

  assert.equal(parsed.messageId, "m1");
  assert.equal(parsed.threadId, "t1");
  assert.equal(parsed.attachmentCount, 1);
  assert.equal(parsed.isRead, true);
});

test("Outlook parser maps ids and recipients", () => {
  const service = new OutlookAuthService();
  const parsed = service.parseOutlookMessage({
    id: "m1",
    conversationId: "t1",
    subject: "Sub",
    from: { emailAddress: { name: "Jane", address: "jane@example.com" } },
    toRecipients: [{ emailAddress: { address: "me@example.com" } }],
    ccRecipients: [{ emailAddress: { address: "cc@example.com" } }],
    body: { contentType: "html", content: "<p>x</p>" },
    bodyPreview: "x",
    sentDateTime: new Date().toISOString(),
    receivedDateTime: new Date().toISOString(),
    hasAttachments: true,
    categories: ["cat"],
    isRead: false,
  });

  assert.equal(parsed.messageId, "m1");
  assert.equal(parsed.threadId, "t1");
  assert.equal(parsed.ccEmails[0], "cc@example.com");
  assert.equal(parsed.isRead, false);
});
