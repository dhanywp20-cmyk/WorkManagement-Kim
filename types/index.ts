export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: Project;
        Insert: ProjectInsert;
        Update: ProjectUpdate;
      };
      work_schedules: {
        Row: WorkSchedule;
        Insert: WorkScheduleInsert;
        Update: WorkScheduleUpdate;
      };
      reminder_schedules: {
        Row: ReminderSchedule;
        Insert: ReminderInsert;
        Update: ReminderUpdate;
      };
      project_progress: {
        Row: ProjectProgress;
        Insert: ProjectProgressInsert;
        Update: ProjectProgressUpdate;
      };
      notifications: {
        Row: Notification;
        Insert: NotificationInsert;
        Update: NotificationUpdate;
      };
      audit_logs: {
        Row: AuditLog;
        Insert: AuditInsert;
        Update: AuditUpdate;
      };
    };
  };
}

// ─── PROJECT ────────────────────────────────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  description: string | null;
  owner_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectInsert {
  id?: string;
  name: string;
  description?: string | null;
  owner_user_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectUpdate {
  id?: string;
  name?: string;
  description?: string | null;
  owner_user_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

// ─── WORK SCHEDULE ──────────────────────────────────────────────────────────

export type ScheduleCategory =
  | 'Demo Produk - Pasang'
  | 'Demo Produk - Bongkar'
  | 'Instal Jual'
  | 'Konfigurasi';

export type ScheduleStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'blocked'
  | 'cancelled';

export interface WorkSchedule {
  id: string;
  project_id: string | null;
  source_reminder_id: string | null;
  category: ScheduleCategory;
  title: string | null;
  pic_user_id: string;
  installer_support_count: number;
  schedule_date: string; // ISO date
  start_time: string;   // HH:MM:SS
  end_time: string;     // HH:MM:SS
  status: ScheduleStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface WorkScheduleInsert {
  id?: string;
  project_id?: string | null;
  source_reminder_id?: string | null;
  category: ScheduleCategory;
  title?: string | null;
  pic_user_id: string;
  installer_support_count?: number;
  schedule_date: string;
  start_time: string;
  end_time: string;
  status?: ScheduleStatus;
  notes?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface WorkScheduleUpdate {
  project_id?: string | null;
  source_reminder_id?: string | null;
  category?: ScheduleCategory;
  title?: string | null;
  pic_user_id?: string;
  installer_support_count?: number;
  schedule_date?: string;
  start_time?: string;
  end_time?: string;
  status?: ScheduleStatus;
  notes?: string | null;
  updated_by?: string | null;
}

// ─── REMINDER SCHEDULE ──────────────────────────────────────────────────────

export interface ReminderSchedule {
  id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  pic_user_id: string | null;
  scheduled_at: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface ReminderInsert {
  id?: string;
  project_id?: string | null;
  title: string;
  description?: string | null;
  pic_user_id?: string | null;
  scheduled_at?: string | null;
  completed?: boolean;
  created_by?: string | null;
}

export interface ReminderUpdate {
  project_id?: string | null;
  title?: string;
  description?: string | null;
  pic_user_id?: string | null;
  scheduled_at?: string | null;
  completed?: boolean;
}

// ─── PROJECT PROGRESS ───────────────────────────────────────────────────────

export interface ProjectProgress {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  progress_percent: number;
  status: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface ProjectProgressInsert {
  id?: string;
  project_id: string;
  title: string;
  description?: string | null;
  progress_percent?: number;
  status?: string | null;
  created_by?: string | null;
}

export interface ProjectProgressUpdate {
  project_id?: string;
  title?: string;
  description?: string | null;
  progress_percent?: number;
  status?: string | null;
}

// ─── NOTIFICATION ───────────────────────────────────────────────────────────

export type NotificationType =
  | 'schedule_created'
  | 'schedule_approved'
  | 'pic_assigned'
  | 'schedule_changed'
  | 'rescheduled'
  | 'blocked'
  | 'completed';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string | null;
  type: string | null;
  read: boolean;
  related_id: string | null;
  created_at: string;
}

export interface NotificationInsert {
  id?: string;
  user_id: string;
  title: string;
  message?: string | null;
  type?: string | null;
  read?: boolean;
  related_id?: string | null;
  created_at?: string;
}

export interface NotificationUpdate {
  user_id?: string;
  title?: string;
  message?: string | null;
  type?: string | null;
  read?: boolean;
  related_id?: string | null;
}

// ─── AUDIT LOG ──────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  action: string;
  table_name: string | null;
  record_id: string | null;
  user_id: string | null;
  old_values: Json | null;
  new_values: Json | null;
  created_at: string;
}

export interface AuditInsert {
  id?: string;
  action: string;
  table_name?: string | null;
  record_id?: string | null;
  user_id?: string | null;
  old_values?: Json | null;
  new_values?: Json | null;
  created_at?: string;
}

export interface AuditUpdate {
  action?: string;
  table_name?: string | null;
  record_id?: string | null;
  user_id?: string | null;
  old_values?: Json | null;
  new_values?: Json | null;
  created_at?: string;
}
