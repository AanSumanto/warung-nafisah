/**
 * Narrow menu lookup for reward catalog validation.
 * Does not couple loyalty domain to Mongoose.
 */
export interface MenuReference {
  readonly kodeMenu: string;
  readonly namaMenu: string;
  readonly status: string;
  readonly hargaJual: number;
}

export interface IMenuReferenceLookup {
  findByKodeMenu(kodeMenu: string): Promise<MenuReference | null>;
  /** Batch lookup — avoids N+1 for portal/catalog projections. */
  findByKodeMenus(kodeMenus: readonly string[]): Promise<Map<string, MenuReference>>;
}
