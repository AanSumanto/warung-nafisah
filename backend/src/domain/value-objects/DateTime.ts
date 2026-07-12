import { ValueObject } from '../base/ValueObject.js';
import { DomainError } from '../errors/DomainError.js';

export const DEFAULT_TIMEZONE = 'Asia/Jakarta';

export interface DateTimeProps {
  value: string;
  timezone: string;
}

export class DateTime extends ValueObject<DateTimeProps> {
  private readonly date: Date;

  private constructor(props: DateTimeProps, date: Date) {
    super(props);
    this.date = date;
  }

  protected override validate(): void {
    if (Number.isNaN(this.date.getTime())) {
      throw DomainError.invalidArgument('Invalid date value', 'value');
    }
    if (!this.props.timezone) {
      throw DomainError.invalidArgument('Timezone is required', 'timezone');
    }
  }

  static now(timezone: string = DEFAULT_TIMEZONE): DateTime {
    return DateTime.fromDate(new Date(), timezone);
  }

  static fromISO(iso: string, timezone: string = DEFAULT_TIMEZONE): DateTime {
    const date = new Date(iso);
    return new DateTime({ value: date.toISOString(), timezone }, date);
  }

  static fromDate(date: Date, timezone: string = DEFAULT_TIMEZONE): DateTime {
    return new DateTime({ value: date.toISOString(), timezone }, new Date(date.getTime()));
  }

  toDate(): Date {
    return new Date(this.date.getTime());
  }

  toISOString(): string {
    return this.date.toISOString();
  }

  get timezone(): string {
    return this.props.timezone;
  }

  isBefore(other: DateTime): boolean {
    return this.date.getTime() < other.date.getTime();
  }

  isAfter(other: DateTime): boolean {
    return this.date.getTime() > other.date.getTime();
  }

  format(locale = 'id-ID'): string {
    return new Intl.DateTimeFormat(locale, {
      timeZone: this.props.timezone,
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(this.date);
  }

  override toJSON(): DateTimeProps {
    return { ...this.props };
  }
}
