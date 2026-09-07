import { apiClient, isApiNotFound } from '@/shared/lib/api';
import type { ApiSuccessResponse } from '@/types/api';
import type { CustomerSummary } from './loyaltyTypes';

async function unwrap<T>(promise: Promise<{ data: ApiSuccessResponse<T> }>): Promise<T> {
  const response = await promise;
  return response.data.data;
}

export async function fetchLoyaltyPosUi(): Promise<{
  memberUiEnabled: boolean;
  receiptQrEnabled: boolean;
  redemptionEnabled: boolean;
}> {
  try {
    return await unwrap(
      apiClient.get<
        ApiSuccessResponse<{
          memberUiEnabled: boolean;
          receiptQrEnabled?: boolean;
          redemptionEnabled?: boolean;
        }>
      >('/loyalty/pos-ui'),
    ).then((data) => ({
      memberUiEnabled: Boolean(data.memberUiEnabled),
      receiptQrEnabled: Boolean(data.receiptQrEnabled),
      redemptionEnabled: Boolean(data.redemptionEnabled),
    }));
  } catch (error) {
    if (isApiNotFound(error)) {
      return { memberUiEnabled: false, receiptQrEnabled: false, redemptionEnabled: false };
    }
    return { memberUiEnabled: false, receiptQrEnabled: false, redemptionEnabled: false };
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

export async function fetchOrderRewards(orderId: string): Promise<import('./loyaltyTypes').OrderRewardsResponse> {
  return unwrap(
    apiClient.get(`/orders/${orderId}/rewards`),
  );
}

export async function setOrderReward(orderId: string, rewardCode: string): Promise<unknown> {
  return unwrap(apiClient.put(`/orders/${orderId}/reward`, { rewardCode }));
}

export async function clearOrderReward(orderId: string): Promise<unknown> {
  return unwrap(apiClient.delete(`/orders/${orderId}/reward`));
}

export const loyaltyPosQueryKeys = {
  posUi: ['loyalty', 'pos-ui'] as const,
  orderRewards: (orderId: string) => ['loyalty', 'order-rewards', orderId] as const,
};
