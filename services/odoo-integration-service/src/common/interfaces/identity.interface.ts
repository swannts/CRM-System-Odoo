import { Request } from 'express';

export interface Identity {
  userId: string;
  orgId: string;
  roles?: string[];
}

export interface IdentityRequest extends Request {
  identity: Identity;
}
