export interface ConsumerLogEntry {
  readonly id: string;
  readonly eventId: string;
  readonly handlerName: string;
  readonly processedAt: Date;
}

export interface IEventConsumerLog {
  isProcessed(eventId: string, handlerName: string): Promise<boolean>;
  record(eventId: string, handlerName: string): Promise<ConsumerLogEntry>;
}
