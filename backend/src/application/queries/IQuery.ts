export interface IQuery {
  readonly type: string;
}

export interface IQueryMetadata {
  readonly correlationId?: string;
  readonly requestId?: string;
}

export type QueryPayload<T extends IQuery = IQuery> = T;
