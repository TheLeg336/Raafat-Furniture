/** Workshop (worker) API client — spec-only order views, no prices. */
import { apiFetch } from './api';
import type { LocalizedString, FulfillmentType, OrderStatus } from '../types';

export interface WorkerOrderItem {
  name: LocalizedString | string;
  quantity: number;
  color?: string;
  material?: string;
  customDimensions?: string;
  imageUrl?: string;
}

export interface WorkerOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: OrderStatus;
  fulfillment: FulfillmentType;
  customerNote?: string;
  prepared: number[];
  items: WorkerOrderItem[];
}

export async function fetchWorkerOrders(): Promise<WorkerOrder[]> {
  const { orders } = await apiFetch<{ orders: WorkerOrder[] }>('/api/worker/orders', undefined, 'GET');
  return orders;
}

export async function saveWorkerPrepared(orderId: string, prepared: number[]): Promise<void> {
  await apiFetch(`/api/worker/orders/${orderId}/prepared`, { prepared });
}

export async function completeWorkerOrder(orderId: string): Promise<void> {
  await apiFetch(`/api/worker/orders/${orderId}/complete`, {});
}
