export interface SmmCategory {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  services_count: number;
}

export interface SmmService {
  id: number;
  category: {
    id: number;
    name: string;
  };
  name: string;
  description?: string;
  type: string;
  price_per_1000: number;
  min_order: number;
  max_order: number;
  average_time_minutes?: number;
  refill_enabled: boolean;
  refill_days?: number;
  cancel_enabled: boolean;
}

export type SmmOrderStatus =
  | 'pending'
  | 'processing'
  | 'in_progress'
  | 'completed'
  | 'partial'
  | 'cancelled'
  | 'failed'
  | 'awaiting_fulfillment';

export interface SmmOrder {
  id: number;
  reference: string;
  service: {
    name: string;
    category: string;
  };
  link: string;
  quantity: number;
  amount: number;
  status: SmmOrderStatus;
  start_count?: number;
  remains?: number;
  progress: number;
  created_at: string;
  completed_at?: string;
  fulfilled_at?: string;
  admin_notes?: string;
}

export function getSmmStatusColor(status: SmmOrderStatus): string {
  const colors: Record<SmmOrderStatus, string> = {
    pending: 'gray',
    processing: 'blue',
    in_progress: 'yellow',
    completed: 'green',
    partial: 'orange',
    cancelled: 'red',
    failed: 'red',
    awaiting_fulfillment: 'purple',
  };
  return colors[status] || 'gray';
}

export function getSmmStatusLabel(status: SmmOrderStatus): string {
  const labels: Record<SmmOrderStatus, string> = {
    pending: 'Pending',
    processing: 'Processing',
    in_progress: 'In Progress',
    completed: 'Completed',
    partial: 'Partial',
    cancelled: 'Cancelled',
    failed: 'Failed',
    awaiting_fulfillment: 'Awaiting Fulfillment',
  };
  return labels[status] || status;
}
