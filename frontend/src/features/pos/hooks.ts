'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  closeShift,
  createOrder,
  fetchCurrentShift,
  fetchMenus,
  fetchOrder,
  fetchOwnerDashboardToday,
  fetchTodayOrders,
  openShift,
  payOrder,
  posQueryKeys,
  updateOrderItems,
} from './api';
import type {
  CloseShiftRequest,
  CreateOrderRequest,
  OpenShiftRequest,
  PayOrderRequest,
  UpdateOrderItemsRequest,
} from './types';

export function useMenus() {
  return useQuery({
    queryKey: posQueryKeys.menus(),
    queryFn: fetchMenus,
  });
}

export function useTodayOrders() {
  return useQuery({
    queryKey: posQueryKeys.todayOrders(),
    queryFn: fetchTodayOrders,
  });
}

export function useOrder(orderId: string | null) {
  return useQuery({
    queryKey: posQueryKeys.order(orderId ?? ''),
    queryFn: () => fetchOrder(orderId!),
    enabled: Boolean(orderId),
  });
}

export function useCurrentShift() {
  return useQuery({
    queryKey: posQueryKeys.currentShift(),
    queryFn: fetchCurrentShift,
  });
}

export function useOwnerDashboard() {
  return useQuery({
    queryKey: posQueryKeys.ownerDashboard(),
    queryFn: fetchOwnerDashboardToday,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateOrderRequest) => createOrder(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: posQueryKeys.todayOrders() });
    },
  });
}

export function useUpdateOrderItems() {
  return useMutation({
    mutationFn: ({ orderId, body }: { orderId: string; body: UpdateOrderItemsRequest }) =>
      updateOrderItems(orderId, body),
  });
}

export function usePayOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, body }: { orderId: string; body: PayOrderRequest }) => payOrder(orderId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: posQueryKeys.todayOrders() });
      void queryClient.invalidateQueries({ queryKey: posQueryKeys.ownerDashboard() });
    },
  });
}

export function useOpenShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: OpenShiftRequest) => openShift(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: posQueryKeys.currentShift() });
    },
  });
}

export function useCloseShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ shiftId, body }: { shiftId: string; body: CloseShiftRequest }) => closeShift(shiftId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: posQueryKeys.currentShift() });
    },
  });
}
