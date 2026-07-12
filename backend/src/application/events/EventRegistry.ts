import type { IEventHandler } from './IEventHandler.js';

export class EventRegistry {
  private readonly handlers = new Map<string, IEventHandler[]>();

  register(handler: IEventHandler): this {
    const list = this.handlers.get(handler.eventName) ?? [];
    if (list.some((h) => h.handlerName === handler.handlerName)) {
      throw new Error(`Handler ${handler.handlerName} already registered for ${handler.eventName}`);
    }
    list.push(handler);
    this.handlers.set(handler.eventName, list);
    return this;
  }

  getHandlers(eventName: string): readonly IEventHandler[] {
    return this.handlers.get(eventName) ?? [];
  }

  getHandler(eventName: string, handlerName: string): IEventHandler | undefined {
    return this.getHandlers(eventName).find((h) => h.handlerName === handlerName);
  }

  listEventNames(): string[] {
    return [...this.handlers.keys()];
  }

  clear(): void {
    this.handlers.clear();
  }
}
