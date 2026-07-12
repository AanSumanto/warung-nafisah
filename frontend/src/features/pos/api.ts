import { apiClient } from '@/shared/lib/api';
import type { ApiSuccessResponse } from '@/types/api';
import type {
  CloseShiftRequest,
  CreateOrderRequest,
  DashboardStats,
  Menu,
  OpenShiftRequest,
  Order,
  PayOrderRequest,
  ShiftClosed,
  ShiftCurrent,
  ShiftOpen,
  UpdateOrderItemsRequest,
} from './types';

async function unwrap<T>(promise: Promise<{ data: ApiSuccessResponse<T> }>): Promise<T> {
  const response = await promise;
  return response.data.data;
}

export async function fetchMenus(): Promise<Menu[]> {
  return unwrap(apiClient.get<ApiSuccessResponse<Menu[]>>('/menus'));
}

export async function createOrder(body: CreateOrderRequest): Promise<Order> {
  return unwrap(apiClient.post<ApiSuccessResponse<Order>>('/orders', body));
}

export async function updateOrderItems(orderId: string, body: UpdateOrderItemsRequest): Promise<Order> {
  return unwrap(apiClient.put<ApiSuccessResponse<Order>>(`/orders/${orderId}/items`, body));
}

export async function payOrder(orderId: string, body: PayOrderRequest): Promise<Order> {
  return unwrap(apiClient.post<ApiSuccessResponse<Order>>(`/orders/${orderId}/pay`, body));
}

export async function fetchTodayOrders(): Promise<Order[]> {
  return unwrap(apiClient.get<ApiSuccessResponse<Order[]>>('/orders/today'));
}

export async function fetchOrder(orderId: string): Promise<Order> {
  return unwrap(apiClient.get<ApiSuccessResponse<Order>>(`/orders/${orderId}`));
}

export async function openShift(body: OpenShiftRequest): Promise<ShiftOpen> {
  return unwrap(apiClient.post<ApiSuccessResponse<ShiftOpen>>('/shifts/open', body));
}

export async function closeShift(shiftId: string, body: CloseShiftRequest): Promise<ShiftClosed> {
  return unwrap(apiClient.post<ApiSuccessResponse<ShiftClosed>>(`/shifts/${shiftId}/close`, body));
}

export async function fetchCurrentShift(): Promise<ShiftCurrent> {
  return unwrap(apiClient.get<ApiSuccessResponse<ShiftCurrent>>('/shifts/current'));
}

export async function fetchOwnerDashboardToday(): Promise<DashboardStats> {
  return unwrap(apiClient.get<ApiSuccessResponse<DashboardStats>>('/owner/dashboard/today'));
}

export const posQueryKeys = {
  all: ['pos'] as const,
  menus: () => [...posQueryKeys.all, 'menus'] as const,
  todayOrders: () => [...posQueryKeys.all, 'orders', 'today'] as const,
  order: (id: string) => [...posQueryKeys.all, 'orders', id] as const,
  currentShift: () => [...posQueryKeys.all, 'shifts', 'current'] as const,
  ownerDashboard: () => [...posQueryKeys.all, 'owner', 'dashboard', 'today'] as const,
};
