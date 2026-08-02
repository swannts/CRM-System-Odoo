import { Request } from "express";

export interface AuthenticatedRequest extends Request {
  identity: {
    orgId: string;
    userId: string;
    orgRole?: string | null;
    membership?: any;
    permissions?: string[];
    platformRoles?: string[];
    platformRole?: string | null;
  };
}
