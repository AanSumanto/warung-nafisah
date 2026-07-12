import { DomainError } from '../errors/DomainError.js';
import { assertIntegerRupiah, multiplyIntegerRupiah } from './integerMoney.js';
import type { MenuType } from './PosTypes.js';
import { MENU_TYPES } from './PosTypes.js';

export interface OrderItemProps {
  readonly kodeMenu: string;
  readonly namaMenu: string;
  readonly kodeKategori: string;
  readonly namaKategori: string;
  readonly tipeMenu: MenuType;
  readonly hargaJual: number;
  readonly qty: number;
  readonly subtotal: number;
  readonly note?: string;
}

export class OrderItem {
  constructor(
    readonly id: string,
    readonly props: OrderItemProps,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.props.kodeMenu.trim()) {
      throw DomainError.invalidArgument('kodeMenu is required', 'kodeMenu');
    }
    if (!this.props.namaMenu.trim()) {
      throw DomainError.invalidArgument('namaMenu is required', 'namaMenu');
    }
    if (!MENU_TYPES.includes(this.props.tipeMenu)) {
      throw DomainError.invalidArgument('tipeMenu must be ITEM or BUNDLE', 'tipeMenu');
    }
    assertIntegerRupiah(this.props.hargaJual, 'hargaJual');
    if (!Number.isInteger(this.props.qty) || this.props.qty < 1) {
      throw DomainError.invalidArgument('qty must be a positive integer', 'qty');
    }
    assertIntegerRupiah(this.props.subtotal, 'subtotal');
    const expected = multiplyIntegerRupiah(this.props.hargaJual, this.props.qty);
    if (this.props.subtotal !== expected) {
      throw DomainError.invalidArgument('subtotal must equal hargaJual × qty', 'subtotal');
    }
  }

  get kodeMenu(): string {
    return this.props.kodeMenu;
  }

  get namaMenu(): string {
    return this.props.namaMenu;
  }

  get kodeKategori(): string {
    return this.props.kodeKategori;
  }

  get namaKategori(): string {
    return this.props.namaKategori;
  }

  get tipeMenu(): MenuType {
    return this.props.tipeMenu;
  }

  get hargaJual(): number {
    return this.props.hargaJual;
  }

  get qty(): number {
    return this.props.qty;
  }

  get note(): string | undefined {
    return this.props.note;
  }

  get subtotal(): number {
    return this.props.subtotal;
  }

  withQty(qty: number): OrderItem {
    const subtotal = multiplyIntegerRupiah(this.props.hargaJual, qty);
    return new OrderItem(this.id, { ...this.props, qty, subtotal });
  }

  withNote(note?: string): OrderItem {
    return new OrderItem(this.id, { ...this.props, note: note?.trim() || undefined });
  }

  toJSON(): OrderItemProps & { id: string } {
    return {
      id: this.id,
      ...this.props,
    };
  }

  static snapshotFromMenu(input: {
    kodeMenu: string;
    namaMenu: string;
    kodeKategori: string;
    namaKategori: string;
    tipeMenu: MenuType;
    hargaJual: number;
    qty: number;
    note?: string;
  }): OrderItemProps {
    const subtotal = multiplyIntegerRupiah(input.hargaJual, input.qty);
    return {
      kodeMenu: input.kodeMenu,
      namaMenu: input.namaMenu,
      kodeKategori: input.kodeKategori,
      namaKategori: input.namaKategori,
      tipeMenu: input.tipeMenu,
      hargaJual: input.hargaJual,
      qty: input.qty,
      subtotal,
      note: input.note?.trim() || undefined,
    };
  }
}
