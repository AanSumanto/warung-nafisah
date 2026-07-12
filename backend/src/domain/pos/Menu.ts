import { BaseEntity } from '../base/BaseEntity.js';
import type { Identifier } from '../common/Identifier.js';
import { createIdentifier } from '../common/Identifier.js';
import { DomainError } from '../errors/DomainError.js';
import { assertIntegerRupiah } from './integerMoney.js';
import type { BundleComponent, MenuCategoryCode, MenuStatus, MenuType } from './PosTypes.js';
import { MENU_CATEGORY_CODES, MENU_TYPES } from './PosTypes.js';

export interface MenuProps extends Record<string, unknown> {
  kodeMenu: string;
  namaMenu: string;
  tipeMenu: MenuType;
  kodeKategori: MenuCategoryCode;
  namaKategori: string;
  hargaJual: number;
  status: MenuStatus;
  sellingTime?: string;
  /** Future Recipe sprint — composition for BUNDLE menus. */
  bundleItems?: BundleComponent[];
}

export class Menu extends BaseEntity<MenuProps> {
  private constructor(props: MenuProps, id: Identifier, createdAt: Date, updatedAt: Date) {
    super(props, id, createdAt, updatedAt);
  }

  static create(id: string, props: MenuProps): Menu {
    Menu.validateProps(props);
    const now = new Date();
    return new Menu(
      {
        ...props,
        kodeMenu: props.kodeMenu.trim().toUpperCase(),
        namaMenu: props.namaMenu.trim(),
        namaKategori: props.namaKategori.trim(),
        bundleItems: props.bundleItems?.map((item) => ({
          kodeMenu: item.kodeMenu.trim().toUpperCase(),
          qty: item.qty,
        })),
      },
      createIdentifier(id),
      now,
      now,
    );
  }

  static reconstitute(
    id: string,
    props: MenuProps,
    createdAt: Date,
    updatedAt: Date,
  ): Menu {
    return new Menu(props, createIdentifier(id), createdAt, updatedAt);
  }

  private static validateProps(props: MenuProps): void {
    if (!props.kodeMenu.trim()) {
      throw DomainError.invalidArgument('kodeMenu is required', 'kodeMenu');
    }
    if (!props.namaMenu.trim()) {
      throw DomainError.invalidArgument('namaMenu is required', 'namaMenu');
    }
    if (!MENU_TYPES.includes(props.tipeMenu)) {
      throw DomainError.invalidArgument('tipeMenu must be ITEM or BUNDLE', 'tipeMenu');
    }
    if (!MENU_CATEGORY_CODES.includes(props.kodeKategori)) {
      throw DomainError.invalidArgument('kodeKategori is invalid', 'kodeKategori');
    }
    if (!props.namaKategori.trim()) {
      throw DomainError.invalidArgument('namaKategori is required', 'namaKategori');
    }
    assertIntegerRupiah(props.hargaJual, 'hargaJual');

    if (props.tipeMenu === 'BUNDLE' && props.bundleItems && props.bundleItems.length > 0) {
      for (const component of props.bundleItems) {
        if (!component.kodeMenu.trim()) {
          throw DomainError.invalidArgument('bundleItems.kodeMenu is required', 'bundleItems');
        }
        if (!Number.isInteger(component.qty) || component.qty < 1) {
          throw DomainError.invalidArgument('bundleItems.qty must be a positive integer', 'bundleItems');
        }
      }
    }
  }

  get kodeMenu(): string {
    return this.props.kodeMenu;
  }

  get namaMenu(): string {
    return this.props.namaMenu;
  }

  get tipeMenu(): MenuType {
    return this.props.tipeMenu;
  }

  get kodeKategori(): MenuCategoryCode {
    return this.props.kodeKategori;
  }

  get namaKategori(): string {
    return this.props.namaKategori;
  }

  get hargaJual(): number {
    return this.props.hargaJual;
  }

  get status(): MenuStatus {
    return this.props.status;
  }

  get sellingTime(): string | undefined {
    return this.props.sellingTime;
  }

  get bundleItems(): readonly BundleComponent[] | undefined {
    return this.props.bundleItems;
  }

  isSellable(): boolean {
    return this.props.status === 'available';
  }

  update(props: Partial<MenuProps>): Menu {
    const next: MenuProps = {
      kodeMenu: props.kodeMenu?.trim().toUpperCase() ?? this.props.kodeMenu,
      namaMenu: props.namaMenu?.trim() ?? this.props.namaMenu,
      tipeMenu: props.tipeMenu ?? this.props.tipeMenu,
      kodeKategori: props.kodeKategori ?? this.props.kodeKategori,
      namaKategori: props.namaKategori?.trim() ?? this.props.namaKategori,
      hargaJual: props.hargaJual ?? this.props.hargaJual,
      status: props.status ?? this.props.status,
      sellingTime: props.sellingTime ?? this.props.sellingTime,
      bundleItems: props.bundleItems ?? this.props.bundleItems,
    };
    Menu.validateProps(next);
    return new Menu(next, this.id, this.createdAt, new Date());
  }
}
