export type EmailProvider = 'gmail' | 'outlook';

export type EmailAccountScope = {
  orgId: string;
  userId: string;
};

export type EmailAccountQuery = {
  accountId?: string;
  search?: string;
  limit?: string | number;
  offset?: string | number;
  threadId?: string;
  folder?: string;
};

export type EmailTemplateInput = {
  orgId: string;
  userId: string;
  name: string;
  subject: string;
  body: string;
  category?: string;
  variables: string[];
};
