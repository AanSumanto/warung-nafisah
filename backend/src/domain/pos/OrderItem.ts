import { DomainError } from '../errors/DomainError.js';
import { assertIntegerRupiah, multiplyIntegerRupiah } from './integerMoney.js';
import type { MenuType } from './PosTypes.js';
import { MENU_TYPES } from './PosTypes.js';

export const ORDER_LINE_KINDS = ['PAID', 'REWARD'] as const;
export type OrderLineKind = (typeof ORDER_LINE_KINDS)[number];

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
  /** Default PAID for historical lines. */
  readonly lineKind?: OrderLineKind;
  /** Present on REWARD lines — audit snapshot. */
  readonly rewardCode?: string;
  readonly rewardHppSnapshot?: number;
  readonly pointsUsed?: number;
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
    const kind = this.props.lineKind ?? 'PAID';
    if (!ORDER_LINE_KINDS.includes(kind)) {
      throw DomainError.invalidArgument('lineKind invalid', 'lineKind');
    }
    if (kind === 'REWARD') {
      if (this.props.hargaJual !== 0 || this.props.subtotal !== 0) {
        throw DomainError.invalidArgument('REWARD line must be Rp0', 'hargaJual');
      }
      if (this.props.qty !== 1) {
        throw DomainError.invalidArgument('REWARD line qty must be 1', 'qty');
      }
      if (!this.props.rewardCode?.trim()) {
        throw DomainError.invalidArgument('rewardCode required on REWARD line', 'rewardCode');
      }
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

  get lineKind(): OrderLineKind {
    return this.props.lineKind ?? 'PAID';
  }

  get rewardCode(): string | undefined {
    return this.props.rewardCode;
  }

  get rewardHppSnapshot(): number | undefined {
    return this.props.rewardHppSnapshot;
  }

  get pointsUsed(): number | undefined {
    return this.props.pointsUsed;
  }

  withQty(qty: number): OrderItem {
    if (this.lineKind === 'REWARD') {
      throw DomainError.invariant('Cannot change qty on REWARD line');
    }
    const subtotal = multiplyIntegerRupiah(this.props.hargaJual, qty);
    return new OrderItem(this.id, { ...this.props, qty, subtotal });
  }

  withNote(note?: string): OrderItem {
    return new OrderItem(this.id, { ...this.props, note: note?.trim() || undefined });
  }

  toJSON(): OrderItemProps & { id: string; lineKind: OrderLineKind } {
    return {
      id: this.id,
      ...this.props,
      lineKind: this.lineKind,
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
      lineKind: 'PAID',
    };
  }

  static rewardLine(input: {
    kodeMenu: string;
    namaMenu: string;
    kodeKategori: string;
    namaKategori: string;
    tipeMenu: MenuType;
    rewardCode: string;
    rewardHppSnapshot: number;
    pointsUsed: number;
  }): OrderItemProps {
    return {
      kodeMenu: input.kodeMenu,
      namaMenu: input.namaMenu,
      kodeKategori: input.kodeKategori,
      namaKategori: input.namaKategori,
      tipeMenu: input.tipeMenu,
      hargaJual: 0,
      qty: 1,
      subtotal: 0,
      note: 'Reward',
      lineKind: 'REWARD',
      rewardCode: input.rewardCode,
      rewardHppSnapshot: input.rewardHppSnapshot,
      pointsUsed: input.pointsUsed,
    };
  }
}
