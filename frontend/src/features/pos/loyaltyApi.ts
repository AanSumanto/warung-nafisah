import { apiClient, isApiNotFound } from '@/shared/lib/api';
import type { ApiSuccessResponse } from '@/types/api';
import type { CustomerSummary } from './loyaltyTypes';

async function unwrap<T>(promise: Promise<{ data: ApiSuccessResponse<T> }>): Promise<T> {
  const response = await promise;
  return response.data.data;
}

export async function fetchLoyaltyPosUi(): Promise<{ memberUiEnabled: boolean }> {
  try {
    return await unwrap(
      apiClient.get<ApiSuccessResponse<{ memberUiEnabled: boolean }>>('/loyalty/pos-ui'),
    );
  } catch (error) {
    if (isApiNotFound(error)) {
      return { memberUiEnabled: false };
    }
    // Fail closed — hide unfinished member UI
    return { memberUiEnabled: false };
  }
}

export async function lookupCustomerByPhone(phone: string): Promise<CustomerSummary> {
  return unwrap(
    apiClient.get<ApiSuccessResponse<CustomerSummary>>('/customers/lookup', {
      params: { phone },
    }),
  );
}

export async function registerCustomer(body: {
  phone: string;
  name?: string;
}): Promise<CustomerSummary> {
  return unwrap(apiClient.post<ApiSuccessResponse<CustomerSummary>>('/customers', body));
}

export async function attachOrderCustomer(
  orderId: string,
  customerId: string,
): Promise<unknown> {
  return unwrap(
    apiClient.put(`/orders/${orderId}/customer`, { customerId }),
  );
}

export const loyaltyPosQueryKeys = {
  posUi: ['loyalty', 'pos-ui'] as const,
};
