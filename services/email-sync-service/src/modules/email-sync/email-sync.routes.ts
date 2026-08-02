import { Router } from "express";

import { requireIdentityMiddleware } from "../../middleware/auth.middleware.js";
import { encrypt } from "../../shared/utils/encryption.js";
import { GoogleAuthService } from "../../integrations/email/google-auth.service.js";
import { OutlookAuthService } from "../../integrations/email/outlook-auth.service.js";
import { MailService } from "../../integrations/email/mail.service.js";
import { EmailSyncService } from "./email-sync.service.js";
import { EmailSyncRepository } from "./email-sync.repository.js";
import { EMAIL_PROVIDERS } from "./email-sync.constants.js";
import { SequenceService } from "../sequences/sequence.service.js";

const router = Router();
const googleAuthService = new GoogleAuthService();
const outlookAuthService = new OutlookAuthService();
const emailSyncService = new EmailSyncService();
const emailSyncRepository = new EmailSyncRepository();
const mailService = new MailService();
const sequenceService = new SequenceService();

// All routes require identity context
router.use(requireIdentityMiddleware);

// GET /email/accounts - List connected email accounts
router.get("/accounts", async (req: any, res, next) => {
  try {
    const orgId = req.identity!.orgId;
    const userId = req.identity!.userId;

    const accounts = await emailSyncRepository.listAccounts({ orgId, userId });

    return res.json({
      success: true,
      data: accounts,
      message: "Email accounts retrieved successfully",
    });
  } catch (error) {
    return next(error);
  }
});

// POST /email/accounts/connect - Initiate OAuth connection
router.post("/accounts/connect", async (req: any, res, next) => {
  try {
    const { provider } = req.body; // 'gmail' or 'outlook'
    const orgId = req.identity!.orgId;
    const userId = req.identity!.userId;

    if (!provider || !EMAIL_PROVIDERS.includes(provider)) {
      return res.status(400).json({
        success: false,
        error: "Provider must be gmail or outlook",
      });
    }

    let authUrl = "";
    if (provider === "gmail") {
      authUrl = googleAuthService.generateAuthUrl(orgId, userId);
    } else {
      authUrl = outlookAuthService.generateAuthUrl(orgId, userId);
    }

    return res.json({
      success: true,
      data: {
        authUrl,
        provider,
      },
      message: "OAuth connection initiation successful",
    });
  } catch (error) {
    return next(error);
  }
});

// GET /email/callback - Handle OAuth callback
router.get("/callback", async (req, res, next) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.status(400).json({ success: false, error });
    }

    if (!code || !state) {
      return res
        .status(400)
        .json({ success: false, error: "Missing code or state" });
    }

    const { orgId, userId, provider } = JSON.parse(
      Buffer.from(state as string, "base64").toString(),
    );

    let email = "";
    let accessToken = "";
    let refreshToken = "";
    let expiresAt: Date | undefined;

    if (provider === "gmail") {
      const tokens = await googleAuthService.getToken(code as string);
      const userInfo = await googleAuthService.getUserInfo(tokens.access_token!);
      
      email = userInfo.email!;
      accessToken = tokens.access_token!;
      refreshToken = tokens.refresh_token!;
      
      if (tokens.expiry_date) {
        expiresAt = new Date(tokens.expiry_date);
      }
    } else if (provider === "outlook") {
      const tokens: any = await outlookAuthService.getToken(code as string);
      const userInfo: any = await outlookAuthService.getUserInfo(tokens.access_token!);
      
      email = userInfo.mail || userInfo.userPrincipalName!;
      accessToken = tokens.access_token!;
      refreshToken = tokens.refresh_token!;
      
      // Outlook usually provides expires_in (seconds)
      if (tokens.expires_in) {
        expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
      }
    } else {
      return res.status(400).json({ success: false, error: "Invalid provider in state" });
    }

    // Encrypt tokens before storing
    const encryptedAccessToken = encrypt(accessToken);
    const encryptedRefreshToken = refreshToken ? encrypt(refreshToken) : undefined;

    const account = await emailSyncRepository.upsertConnectedAccount({
      orgId,
      userId,
      email,
      provider,
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      expiresAt,
    });

    return res.json({
      success: true,
      data: {
        id: account.id,
        email: account.email,
        provider: account.provider,
        isConnected: account.isConnected,
      },
      message: "Email account connected successfully",
    });
  } catch (error) {
    return next(error);
  }
});

// POST /email/accounts/:id/sync - manually trigger sync for an owned account
router.post("/accounts/:id/sync", async (req: any, res, next) => {
  try {
    const orgId = req.identity!.orgId;
    const userId = req.identity!.userId;
    const accountId = req.params.id;

    const result = await emailSyncService.syncAccountById(accountId, { orgId, userId });
    return res.json({
      success: true,
      data: result,
      message: "Account sync completed",
    });
  } catch (error) {
    return next(error);
  }
});

// GET /email/messages - List emails with filters
router.get("/messages", async (req: any, res, next) => {
  try {
    const { accountId, search, limit, offset, threadId, folder } = req.query;
    const orgId = req.identity!.orgId;
    const userId = req.identity!.userId;

    const ownedAccounts = await emailSyncRepository.listOwnedAccountIds({ orgId, userId });
    const ownedAccountIds = new Set(ownedAccounts.map((a) => a.id));

    if (accountId) {
      if (!ownedAccountIds.has(String(accountId))) {
        return res.status(404).json({ success: false, error: "Email account not found" });
      }
    }
    const { messages, total, take, skip } = await emailSyncRepository.listMessages(
      { orgId, userId },
      { accountId, search, limit, offset, threadId, folder },
      [...ownedAccountIds],
    );

    return res.json({
      success: true,
      data: messages,
      meta: {
        total,
        limit: take,
        offset: skip,
      },
      message: "Email messages retrieved successfully",
    });
  } catch (error) {
    return next(error);
  }
});

// GET /email/accounts/:id/sync-logs
router.get("/accounts/:id/sync-logs", async (req: any, res, next) => {
  try {
    const orgId = req.identity!.orgId;
    const userId = req.identity!.userId;
    const accountId = req.params.id;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;

    const logs = await emailSyncService.getAccountSyncLogs(accountId, { orgId, userId }, limit);
    return res.json({
      success: true,
      data: logs,
      message: "Sync logs retrieved successfully",
    });
  } catch (error) {
    return next(error);
  }
});

// GET /email/sync/status
router.get("/sync/status", async (req: any, res, next) => {
  try {
    const orgId = req.identity!.orgId;
    const userId = req.identity!.userId;
    const status = await emailSyncService.getSyncStatus({ orgId, userId });
    return res.json({
      success: true,
      data: status,
      message: "Sync status retrieved successfully",
    });
  } catch (error) {
    return next(error);
  }
});

// POST /email/send - Send an email
router.post("/send", async (req: any, res, next) => {
  try {
    const { to, subject, body, cc, bcc, dealId, contactId, isHtml, accountId } = req.body;
    const orgId = req.identity!.orgId;
    const userId = req.identity!.userId;

    if (!to || !subject) {
      return res.status(400).json({
        success: false,
        error: "Recipient and subject are required",
      });
    }

    const emailRecord = await mailService.sendEmail({
      orgId,
      userId,
      accountId,
      to,
      subject,
      body,
      cc,
      bcc,
      isHtml,
      relatedDealId: dealId,
      relatedContactId: contactId
    });

    return res.json({
      success: true,
      data: {
        messageId: emailRecord.messageId,
        id: emailRecord.id,
      },
      message: "Email sent successfully",
    });
  } catch (error) {
    return next(error);
  }
});

// GET /email/templates - List email templates
router.get("/templates", async (req: any, res, next) => {
  try {
    const { category } = req.query;
    const orgId = req.identity!.orgId;

    const templates = await emailSyncRepository.listTemplates(orgId, category ? String(category) : undefined);

    return res.json({
      success: true,
      data: templates,
      message: "Email templates retrieved successfully",
    });
  } catch (error) {
    return next(error);
  }
});

// POST /email/templates - Create email template
router.post("/templates", async (req: any, res, next) => {
  try {
    const { name, subject, body, category } = req.body;
    const orgId = req.identity!.orgId;
    const userId = req.identity!.userId;

    if (!name || !subject || !body) {
      return res.status(400).json({
        success: false,
        error: "Name, subject, and body are required",
      });
    }

    // Extract variables from subject and body (e.g. {{firstName}})
    const variableRegex = /{{([^}]+)}}/g;
    const variables = new Set<string>();

    let match;
    while ((match = variableRegex.exec(subject)) !== null) {
      variables.add(match[1]);
    }
    while ((match = variableRegex.exec(body)) !== null) {
      variables.add(match[1]);
    }

    const template = await emailSyncRepository.createTemplate({
      orgId,
      userId,
      name,
      subject,
      body,
      category,
      variables: Array.from(variables),
    });

    res.status(201).json({
      success: true,
      data: {
        id: template.id,
        name: template.name,
        subject: template.subject,
        category: template.category,
        variables: template.variables,
      },
      message: "Email template created successfully",
    });
  } catch (error) {
    return next(error);
  }
});

// GET /email/sequences - List email sequences
router.get("/sequences", async (req: any, res, next) => {
  try {
    const orgId = req.identity!.orgId;
    const sequences = await sequenceService.listSequences(orgId);

    return res.json({
      success: true,
      data: sequences,
      message: "Email sequences retrieved successfully",
    });
  } catch (error) {
    return next(error);
  }
});

// POST /email/sequences - Create email sequence
router.post("/sequences", async (req: any, res, next) => {
  try {
    const { name, description, steps, isActive } = req.body;
    const orgId = req.identity!.orgId;
    const userId = req.identity!.userId;
    const sequence = await sequenceService.createSequence({ orgId, userId, name, description, steps, isActive });

    res.status(201).json({
      success: true,
      data: sequence,
      message: "Email sequence created successfully",
    });
  } catch (error) {
    return next(error);
  }
});

// GET /email/sequences/:id
router.get("/sequences/:id([a-zA-Z0-9-]+)", async (req: any, res, next) => {
  try {
    const orgId = req.identity!.orgId;
    const sequence = await sequenceService.getSequence(orgId, req.params.id);
    return res.json({ success: true, data: sequence, message: "Email sequence retrieved successfully" });
  } catch (error) {
    return next(error);
  }
});

// PATCH /email/sequences/:id
router.patch("/sequences/:id([a-zA-Z0-9-]+)", async (req: any, res, next) => {
  try {
    const orgId = req.identity!.orgId;
    const sequence = await sequenceService.updateSequence({
      orgId,
      sequenceId: req.params.id,
      name: req.body?.name,
      description: req.body?.description,
      isActive: req.body?.isActive,
      steps: req.body?.steps,
    });
    return res.json({ success: true, data: sequence, message: "Email sequence updated successfully" });
  } catch (error) {
    return next(error);
  }
});

// DELETE /email/sequences/:id
router.delete("/sequences/:id([a-zA-Z0-9-]+)", async (req: any, res, next) => {
  try {
    const orgId = req.identity!.orgId;
    const result = await sequenceService.deleteSequence(orgId, req.params.id);
    return res.json({ success: true, data: result, message: "Email sequence deleted successfully" });
  } catch (error) {
    return next(error);
  }
});

// POST /email/sequences/:id/enroll
router.post("/sequences/:id/enroll", async (req: any, res, next) => {
  try {
    const orgId = req.identity!.orgId;
    const sequenceId = req.params.id;
    const { contactEmail, contactId, dealId, firstName, lastName, companyName, dealName } = req.body;
    if (!contactEmail) {
      return res.status(400).json({ success: false, error: "contactEmail is required" });
    }
    const enrollment = await sequenceService.enrollContact({
      orgId,
      sequenceId,
      contactEmail: String(contactEmail).toLowerCase(),
      contactId,
      dealId,
      firstName,
      lastName,
      companyName,
      dealName,
    });
    return res.status(201).json({ success: true, data: enrollment, message: "Contact enrolled successfully" });
  } catch (error) {
    return next(error);
  }
});

// GET /email/sequences/:id/enrollments
router.get("/sequences/:id/enrollments", async (req: any, res, next) => {
  try {
    const orgId = req.identity!.orgId;
    const sequenceId = req.params.id;
    const enrollments = await sequenceService.listEnrollments(orgId, sequenceId);
    return res.json({ success: true, data: enrollments, message: "Enrollments retrieved successfully" });
  } catch (error) {
    return next(error);
  }
});

// POST /email/sequences/enrollments/:id/pause
router.post("/sequences/enrollments/:id/pause", async (req: any, res, next) => {
  try {
    const orgId = req.identity!.orgId;
    const enrollment = await sequenceService.pauseEnrollment(orgId, req.params.id);
    return res.json({ success: true, data: enrollment, message: "Enrollment paused" });
  } catch (error) {
    return next(error);
  }
});

// GET /email/sequences/enrollments/:id
router.get("/sequences/enrollments/:id", async (req: any, res, next) => {
  try {
    const orgId = req.identity!.orgId;
    const enrollment = await sequenceService.getEnrollment(orgId, req.params.id);
    return res.json({ success: true, data: enrollment, message: "Enrollment retrieved successfully" });
  } catch (error) {
    return next(error);
  }
});

// POST /email/sequences/enrollments/:id/resume
router.post("/sequences/enrollments/:id/resume", async (req: any, res, next) => {
  try {
    const orgId = req.identity!.orgId;
    const enrollment = await sequenceService.resumeEnrollment(orgId, req.params.id);
    return res.json({ success: true, data: enrollment, message: "Enrollment resumed" });
  } catch (error) {
    return next(error);
  }
});

// POST /email/sequences/enrollments/:id/cancel
router.post("/sequences/enrollments/:id/cancel", async (req: any, res, next) => {
  try {
    const orgId = req.identity!.orgId;
    const enrollment = await sequenceService.cancelEnrollment(orgId, req.params.id);
    return res.json({ success: true, data: enrollment, message: "Enrollment cancelled" });
  } catch (error) {
    return next(error);
  }
});

// GET /email/sequences/enrollments/:id/timeline
router.get("/sequences/enrollments/:id/timeline", async (req: any, res, next) => {
  try {
    const orgId = req.identity!.orgId;
    const timeline = await sequenceService.getEnrollmentTimeline(orgId, req.params.id);
    return res.json({ success: true, data: timeline, message: "Timeline retrieved successfully" });
  } catch (error) {
    return next(error);
  }
});

// GET /email/sequences/enrollments/:id/status
router.get("/sequences/enrollments/:id/status", async (req: any, res, next) => {
  try {
    const orgId = req.identity!.orgId;
    const status = await sequenceService.getEnrollmentStatus(orgId, req.params.id);
    return res.json({
      success: true,
      data: status,
      message: "Enrollment status retrieved successfully",
    });
  } catch (error) {
    return next(error);
  }
});

// POST /email/sequences/unsubscribe
router.post("/sequences/unsubscribe", async (req: any, res, next) => {
  try {
    const orgId = req.identity!.orgId;
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: "email is required" });
    }
    const count = await sequenceService.unsubscribeByEmail(orgId, String(email).toLowerCase());
    return res.json({ success: true, data: { updated: count }, message: "Unsubscribe processed" });
  } catch (error) {
    return next(error);
  }
});

// POST /email/sequences/enrollments/:id/events
router.post("/sequences/enrollments/:id/events", async (req: any, res, next) => {
  try {
    const orgId = req.identity!.orgId;
    const { event, message } = req.body;
    if (!event) {
      return res.status(400).json({ success: false, error: "event is required" });
    }
    const result = await sequenceService.trackEnrollmentEvent({
      orgId,
      enrollmentId: req.params.id,
      event,
      message,
    });
    return res.json({ success: true, data: result, message: "Enrollment event tracked" });
  } catch (error) {
    return next(error);
  }
});

export default router;
