export interface TransactionRetryPolicy {
  readonly maxAttempts: number;
  readonly baseDelayMs: number;
}

export const DEFAULT_TRANSACTION_RETRY_POLICY: TransactionRetryPolicy = {
  maxAttempts: 3,
  baseDelayMs: 100,
};

export function isTransientTransactionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes('transienttransactionerror') ||
    message.includes('unknowncommitresult') ||
    message.includes('writeconflict')
  );
}

export async function withTransactionRetry<T>(
  work: () => Promise<T>,
  policy: TransactionRetryPolicy = DEFAULT_TRANSACTION_RETRY_POLICY,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= policy.maxAttempts; attempt++) {
    try {
      return await work();
    } catch (error) {
      lastError = error;
      if (!isTransientTransactionError(error) || attempt >= policy.maxAttempts) {
        throw error;
      }
      const delayMs = policy.baseDelayMs * 2 ** (attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}
