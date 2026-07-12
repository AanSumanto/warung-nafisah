import { ValueObject } from '../base/ValueObject.js';
import { DomainError } from '../errors/DomainError.js';

export type CurrencyCode = 'IDR' | (string & {});
export type RoundingMode = 'HALF_UP' | 'HALF_DOWN' | 'CEILING' | 'FLOOR';

export interface MoneyProps {
  amount: string;
  currency: CurrencyCode;
  precision: number;
  roundingMode: RoundingMode;
}

const DEFAULT_CURRENCY: CurrencyCode = 'IDR';
const DEFAULT_PRECISION = 0;
const DEFAULT_ROUNDING: RoundingMode = 'HALF_UP';

export class Money extends ValueObject<MoneyProps> {
  private constructor(props: MoneyProps) {
    super(props);
  }

  protected override validate(): void {
    if (!/^-?\d+$/.test(this.props.amount)) {
      throw DomainError.invalidArgument('Money amount must be an integer string', 'amount');
    }
    if (this.props.precision < 0) {
      throw DomainError.invalidArgument('Precision cannot be negative', 'precision');
    }
  }

  static zero(currency: CurrencyCode = DEFAULT_CURRENCY): Money {
    return Money.of('0', currency);
  }

  static of(amount: string | number, currency: CurrencyCode = DEFAULT_CURRENCY): Money {
    const normalized = typeof amount === 'number' ? String(Math.trunc(amount)) : amount.trim();
    return new Money({
      amount: normalized,
      currency,
      precision: currency === 'IDR' ? DEFAULT_PRECISION : DEFAULT_PRECISION,
      roundingMode: DEFAULT_ROUNDING,
    });
  }

  static fromProps(props: MoneyProps): Money {
    return new Money(props);
  }

  get amount(): string {
    return this.props.amount;
  }

  get currency(): CurrencyCode {
    return this.props.currency;
  }

  get precision(): number {
    return this.props.precision;
  }

  get roundingMode(): RoundingMode {
    return this.props.roundingMode;
  }

  isZero(): boolean {
    return BigInt(this.props.amount) === 0n;
  }

  isNegative(): boolean {
    return BigInt(this.props.amount) < 0n;
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    const sum = BigInt(this.props.amount) + BigInt(other.props.amount);
    return Money.fromProps({ ...this.props, amount: sum.toString() });
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    const diff = BigInt(this.props.amount) - BigInt(other.props.amount);
    return Money.fromProps({ ...this.props, amount: diff.toString() });
  }

  multiply(factor: number): Money {
    if (!Number.isFinite(factor)) {
      throw DomainError.invalidArgument('Factor must be a finite number', 'factor');
    }
    const product = BigInt(this.props.amount) * BigInt(Math.trunc(factor));
    return Money.fromProps({ ...this.props, amount: product.toString() });
  }

  compare(other: Money): -1 | 0 | 1 {
    this.assertSameCurrency(other);
    const a = BigInt(this.props.amount);
    const b = BigInt(other.props.amount);
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  }

  allocate(ratios: number[]): Money[] {
    if (ratios.length === 0) {
      throw DomainError.invalidArgument('Ratios array cannot be empty', 'ratios');
    }
    const totalRatio = ratios.reduce((s, r) => s + r, 0);
    if (totalRatio <= 0) {
      throw DomainError.invalidArgument('Sum of ratios must be positive', 'ratios');
    }

    const total = BigInt(this.props.amount);
    const results: Money[] = [];
    let allocated = 0n;

    for (let i = 0; i < ratios.length; i++) {
      if (i === ratios.length - 1) {
        results.push(Money.fromProps({ ...this.props, amount: (total - allocated).toString() }));
      } else {
        const share = (total * BigInt(Math.trunc(ratios[i]! * 1000))) / BigInt(Math.trunc(totalRatio * 1000));
        allocated += share;
        results.push(Money.fromProps({ ...this.props, amount: share.toString() }));
      }
    }

    return results;
  }

  toDisplay(): string {
    const value = Number(this.props.amount);
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: this.props.currency,
      minimumFractionDigits: this.props.precision,
      maximumFractionDigits: this.props.precision,
    }).format(value);
  }

  override toJSON(): MoneyProps {
    return { ...this.props };
  }

  private assertSameCurrency(other: Money): void {
    if (this.props.currency !== other.props.currency) {
      throw DomainError.invariant(
        `Currency mismatch: ${this.props.currency} vs ${other.props.currency}`,
      );
    }
  }
}
