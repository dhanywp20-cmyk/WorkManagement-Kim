'use client';

/**
 * Widgets.tsx - kumpulan widget reusable + Widget Registry.
 *
 * Setiap widget: komponen mandiri yang fetch datanya sendiri & render 1 kartu.
 * Registry (WIDGETS) = metadata deklaratif (id, permission, priority, size,
 * Component). Permission Resolver ada di permissions.ts. Proses compose
 * (filter  sort  render) ada di PermissionAwareDashboard.tsx.
 *
 * Widget modul lama (Team Monitoring/Analytics/Piket/Learning/Sales Analytics/
 * Work Queue) dihapus bersama modulnya saat repo ini dikonversi jadi Field
 * Service & Proof of Execution platform - semuanya query tabel yang sudah
 * tidak ada. Registry sengaja dikosongkan; widget Field Service (mis. "Hari
 * Ini" untuk PIC, ringkasan verifikasi untuk Client) ditambahkan di sini
 * begitu modulnya dibangun.
 */

import {
  type WidgetProps, type WidgetSize, type WidgetDef,
  WidgetCard, EmptyState, Loading,
} from './primitives';
export type { WidgetProps, WidgetSize, WidgetDef };
export { WidgetCard, EmptyState, Loading };

// WIDGET REGISTRY - metadata deklaratif. Compose di PermissionAwareDashboard.
export const WIDGETS: WidgetDef[] = [];
