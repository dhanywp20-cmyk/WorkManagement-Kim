import type { ScheduleCategory, ScheduleStatus } from '@/types';

export const SCHEDULE_CATEGORIES: ScheduleCategory[] = [
  'Demo Produk - Pasang',
  'Demo Produk - Bongkar',
  'Instal Jual',
  'Konfigurasi',
];

export const REQUIRED_CATEGORIES: ScheduleCategory[] = [
  'Demo Produk - Pasang',
  'Demo Produk - Bongkar',
  'Instal Jual',
];

// Instal Jual MUST behave exactly like Konfigurasi category wherever category behavior is required.
export const KONFIGURASI_EQUIVALENT_CATEGORIES: ScheduleCategory[] = [
  'Instal Jual',
  'Konfigurasi',
];

// Categories that trigger review workflow (same for Konfigurasi and Instal Jual)
export const REVIEW_TRIGGER_CATEGORIES: ScheduleCategory[] = [
  'Konfigurasi',
  'Instal Jual',
];

// Categories that trigger incentive workflows — preserved for compatibility only.
// No new Incentive logic is created in this implementation.
export const INCENTIVE_TRIGGER_CATEGORIES: ScheduleCategory[] = [
  'Konfigurasi',
  'Instal Jual',
];

// Categories where a controller must review before scheduling
export const CONTROLLER_CATEGORIES: ScheduleCategory[] = [
  'Konfigurasi',
  'Instal Jual',
];

export const SCHEDULE_STATUSES: ScheduleStatus[] = [
  'scheduled',
  'in_progress',
  'completed',
  'blocked',
  'cancelled',
];

export const SCHEDULE_STATUS_LABELS: Record<ScheduleStatus, string> = {
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  completed: 'Completed',
  blocked: 'Blocked',
  cancelled: 'Cancelled',
};

export const SCHEDULE_STATUS_COLORS: Record<ScheduleStatus, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-amber-100 text-amber-800',
  completed: 'bg-emerald-100 text-emerald-800',
  blocked: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

export function isKonfigurasiBehavior(category: ScheduleCategory): boolean {
  return KONFIGURASI_EQUIVALENT_CATEGORIES.includes(category);
}

export function requiresController(category: ScheduleCategory): boolean {
  return CONTROLLER_CATEGORIES.includes(category);
}
