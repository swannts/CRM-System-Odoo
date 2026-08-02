import { z } from 'zod';
import { EMAIL_PROVIDERS } from './email-sync.constants.js';

export const connectAccountSchema = z.object({
  provider: z.enum(EMAIL_PROVIDERS),
});

export const sendEmailSchema = z.object({
  to: z.union([z.string(), z.array(z.string())]),
  subject: z.string().min(1),
  body: z.string().min(1),
  cc: z.union([z.string(), z.array(z.string())]).optional(),
  bcc: z.union([z.string(), z.array(z.string())]).optional(),
  dealId: z.string().optional(),
  contactId: z.string().optional(),
  isHtml: z.boolean().optional(),
  accountId: z.string().optional(),
});

export const createTemplateSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  body: z.string().min(1),
  category: z.string().optional(),
});

export const createSequenceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  steps: z.unknown(),
});
