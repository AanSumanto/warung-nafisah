import type { ICommand } from './ICommand.js';

export interface ICommandHandler<TCommand extends ICommand, TResult = void> {
  readonly commandType: string;
  handle(command: TCommand): Promise<TResult>;
}

export abstract class BaseCommandHandler<TCommand extends ICommand, TResult = void>
  implements ICommandHandler<TCommand, TResult>
{
  abstract readonly commandType: string;
  abstract handle(command: TCommand): Promise<TResult>;
}
