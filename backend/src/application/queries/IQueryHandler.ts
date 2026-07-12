import type { IQuery } from './IQuery.js';

export interface IQueryHandler<TQuery extends IQuery, TResult> {
  readonly queryType: string;
  handle(query: TQuery): Promise<TResult>;
}

export abstract class BaseQueryHandler<TQuery extends IQuery, TResult>
  implements IQueryHandler<TQuery, TResult>
{
  abstract readonly queryType: string;
  abstract handle(query: TQuery): Promise<TResult>;
}
