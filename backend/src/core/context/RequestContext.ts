export interface TenantScope {
  businessGroupId?: string;
  businessId?: string;
  outletId?: string;
  warehouseId?: string;
}

export interface RequestContext {
  requestId: string;
  correlationId: string;
  tenant?: TenantScope;
  startedAt: Date;
}

declare global {
  namespace Express {
    interface Request {
      context: RequestContext;
    }
  }
}

export {};
