export interface BaseDocument {
  readonly _id: string;
}

export interface TimestampDocument extends BaseDocument {
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface AuditDocument extends TimestampDocument {
  readonly createdBy?: string;
  readonly updatedBy?: string;
}

export interface SoftDeleteDocument extends TimestampDocument {
  readonly deletedAt: Date | null;
  readonly isDeleted: boolean;
}

export interface VersionedDocument extends TimestampDocument {
  readonly version: number;
}

export type PersistenceDocument =
  | BaseDocument
  | TimestampDocument
  | AuditDocument
  | SoftDeleteDocument
  | VersionedDocument;
