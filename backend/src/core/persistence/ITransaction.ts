export interface ITransaction {
  readonly id: string;
  readonly isActive: boolean;
  markCommitted(): void;
  markRolledBack(): void;
}

export abstract class BaseTransaction implements ITransaction {
  readonly id: string;
  private _isActive = true;
  private _committed = false;
  private _rolledBack = false;

  constructor(id?: string) {
    this.id = id ?? `txn_${crypto.randomUUID()}`;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get isCommitted(): boolean {
    return this._committed;
  }

  get isRolledBack(): boolean {
    return this._rolledBack;
  }

  markCommitted(): void {
    this._committed = true;
    this._isActive = false;
  }

  markRolledBack(): void {
    this._rolledBack = true;
    this._isActive = false;
  }
}
