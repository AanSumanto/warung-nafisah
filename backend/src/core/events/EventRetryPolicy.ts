export interface EventRetryPolicyConfig {
  readonly maxAttempts: number;
  readonly baseDelayMs: number;
}

export const DEFAULT_EVENT_RETRY_POLICY: EventRetryPolicyConfig = {
  maxAttempts: 3,
  baseDelayMs: 50,
};

export class EventRetryPolicy {
  constructor(private readonly config: EventRetryPolicyConfig = DEFAULT_EVENT_RETRY_POLICY) {}

  get maxAttempts(): number {
    return this.config.maxAttempts;
  }

  async execute<T>(work: () => Promise<T>): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        return await work();
      } catch (error) {
        lastError = error;
        if (attempt >= this.config.maxAttempts) break;
        await new Promise((r) => setTimeout(r, this.config.baseDelayMs * 2 ** (attempt - 1)));
      }
    }

    throw lastError;
  }
}
