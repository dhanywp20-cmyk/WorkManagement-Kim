-- ──────────────────────────────────────────────────────────────────────────────
-- Work Management PTS IVP — Database Schema
-- Model: ONE PROJECT → MANY WORK SCHEDULES
-- No incentive functionality.
-- ──────────────────────────────────────────────────────────────────────────────

-- ============================================================================
-- 1. PROJECTS
-- ============================================================================
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  -- project-level owner (optional)
  owner_user_id uuid,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- ============================================================================
-- 2. CATEGORIES
--    Required categories:
--      Demo Produk - Pasang
--      Demo Produk - Bongkar
--      Instal Jual   (same behavior as Konfigurasi)
-- ============================================================================
create type public.schedule_category as enum (
  'Demo Produk - Pasang',
  'Demo Produk - Bongkar',
  'Instal Jual',
  'Konfigurasi'
);

create type public.schedule_status as enum (
  'scheduled',
  'in_progress',
  'completed',
  'blocked',
  'cancelled'
);

-- ============================================================================
-- 3. WORK SCHEDULES  (Reminder Schedule records operational activities)
-- ============================================================================
create table public.work_schedules (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects (id) on delete set null,
  -- source reminder link (for backfill of project_id)
  source_reminder_id uuid references public.reminder_schedules (id) on delete set null,
  category public.schedule_category not null,
  title text,
  -- exactly 1 PIC per schedule
  pic_user_id uuid not null,
  -- only the count, never individual supporter records
  installer_support_count integer not null default 0 check (installer_support_count >= 0),
  schedule_date date not null,
  start_time time without time zone not null,
  end_time time without time zone not null,
  status public.schedule_status not null default 'scheduled',
  notes text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  created_by uuid,
  updated_by uuid
);

-- ============================================================================
-- 4. REMINDER SCHEDULES  (existing module — REMINDER SCHEDULE)
-- ============================================================================
create table public.reminder_schedules (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects (id) on delete set null,
  title text not null,
  description text,
  pic_user_id uuid,
  scheduled_at timestamp with time zone,
  completed boolean default false,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  created_by uuid
);

-- ============================================================================
-- 5. PROJECT PROGRESS  (existing module — PROJECT PROGRESS)
-- ============================================================================
create table public.project_progress (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects (id) on delete cascade not null,
  title text not null,
  description text,
  progress_percent integer not null default 0 check (progress_percent >= 0 and progress_percent <= 100),
  status text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  created_by uuid
);

-- ============================================================================
-- 6. NOTIFICATIONS
--    Reuse the existing notification system.
-- ============================================================================
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  message text,
  type text,
  read boolean default false,
  related_id uuid,
  created_at timestamp with time zone default now() not null
);

-- ============================================================================
-- 7. AUDIT LOGS
--    Reuse the existing audit system.
-- ============================================================================
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  table_name text,
  record_id uuid,
  user_id uuid,
  old_values jsonb,
  new_values jsonb,
  created_at timestamp with time zone default now() not null
);

-- ============================================================================
-- 8. INDEXES & CONSTRAINTS
-- ============================================================================

-- Fast lookup of schedules by project
create index if not exists idx_work_schedules_project on public.work_schedules (project_id);

-- Fast lookup of schedules by PIC
create index if not exists idx_work_schedules_pic on public.work_schedules (pic_user_id);

-- Fast lookup by date + PIC (used by conflict detection)
create index if not exists idx_work_schedules_pic_date on public.work_schedules (pic_user_id, schedule_date, start_time, end_time);

-- Backfill support: source reminder lookup
create index if not exists idx_work_schedules_source_reminder on public.work_schedules (source_reminder_id);

-- Notification lookup
create index if not exists idx_notifications_user on public.notifications (user_id, read, created_at desc);

-- Audit lookup
create index if not exists idx_audit_logs_record on public.audit_logs (table_name, record_id);

-- Constraint: end_time must be after start_time
alter table public.work_schedules
  add constraint chk_schedule_time_order
  check (end_time > start_time);

-- ============================================================================
-- 9. RLS POLICIES  (preserve existing RLS behavior)
-- ============================================================================

-- Enable RLS on all tables
alter table public.projects enable row level security;
alter table public.work_schedules enable row level security;
alter table public.reminder_schedules enable row level security;
alter table public.project_progress enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

-- Projects: auth users can read/write
create policy "projects_read" on public.projects for select using (auth.uid() is not null);
create policy "projects_write" on public.projects for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- Work Schedules: auth users can read/write
create policy "work_schedules_read" on public.work_schedules for select using (auth.uid() is not null);
create policy "work_schedules_write" on public.work_schedules for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- Reminder Schedules: auth users can read/write
create policy "reminder_read" on public.reminder_schedules for select using (auth.uid() is not null);
create policy "reminder_write" on public.reminder_schedules for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- Project Progress: auth users can read/write
create policy "progress_read" on public.project_progress for select using (auth.uid() is not null);
create policy "progress_write" on public.project_progress for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- Notifications: users can only see their own
create policy "notifications_read" on public.notifications for select using (user_id = auth.uid());
create policy "notifications_write" on public.notifications for insert with check (user_id = auth.uid());

-- Audit Logs: read-only for auth users
create policy "audit_read" on public.audit_logs for select using (auth.uid() is not null);

-- ============================================================================
-- 10. FUNCTIONS & TRIGGERS
-- ============================================================================

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_projects_updated
  before update on public.projects
  for each row execute function public.set_updated_at();

create trigger trg_work_schedules_updated
  before update on public.work_schedules
  for each row execute function public.set_updated_at();

create trigger trg_reminder_updated
  before update on public.reminder_schedules
  for each row execute function public.set_updated_at();

create trigger trg_progress_updated
  before update on public.project_progress
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 11. BACKFILL FUNCTION
--     For existing work_schedules records:
--       if a valid relationship exists through source_reminder_id,
--       backfill project_id automatically.
-- ============================================================================

create or replace function public.backfill_work_schedule_project()
returns void as $$
begin
  update public.work_schedules ws
  set project_id = r.project_id
  from public.reminder_schedules r
  where ws.source_reminder_id = r.id
    and ws.project_id is null
    and r.project_id is not null;
end;
$$ language plpgsql;

-- ============================================================================
-- 12. PIC CONFLICT DETECTION (used by the app layer)
--     Checks: pic_user_id + schedule_date + start_time + end_time
-- ============================================================================

create or replace function public.check_pic_conflict(
  p_pic_user_id uuid,
  p_schedule_date date,
  p_start_time time,
  p_end_time time,
  p_exclude_schedule_id uuid default null
)
returns boolean as $$
declare
  conflict_exists boolean;
begin
  select exists (
    select 1 from public.work_schedules ws
    where ws.pic_user_id = p_pic_user_id
      and ws.schedule_date = p_schedule_date
      and ws.status not in ('cancelled')
      and (
        (p_start_time, p_end_time) overlaps (ws.start_time, ws.end_time)
        or
        (ws.start_time, ws.end_time) overlaps (p_start_time, p_end_time)
      )
      and (p_exclude_schedule_id is null or ws.id <> p_exclude_schedule_id)
  ) into conflict_exists;

  return conflict_exists;
end;
$$ language plpgsql stable;
