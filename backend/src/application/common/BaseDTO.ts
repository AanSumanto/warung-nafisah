export abstract class BaseDTO {
  toJSON(): Record<string, unknown> {
    return { ...(this as object) } as Record<string, unknown>;
  }
}

export type DTOConstructor<T extends BaseDTO = BaseDTO> = new (...args: never[]) => T;
