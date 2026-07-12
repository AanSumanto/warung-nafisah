export interface ICommand {
  readonly type: string;
}

export interface ICommandMetadata {
  readonly correlationId?: string;
  readonly requestId?: string;
  readonly userId?: string;
}

export type CommandPayload<T extends ICommand = ICommand> = T;
