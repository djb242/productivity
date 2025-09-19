-- Supabase schema for the productivity app
-- You can run this inside an existing project.
-- To isolate from other apps, create and use a dedicated schema name.
-- Change `productivity` below if you prefer a different schema.

create schema if not exists productivity;
set search_path to productivity, public;

create table if not exists categories (
  id text primary key,
  name text not null,
  color text
);

create table if not exists goals (
  id text primary key,
  category_id text references categories(id) on delete cascade,
  title text not null
);

create table if not exists tasks (
  id text primary key,
  goal_id text references goals(id) on delete cascade,
  title text not null,
  status text,
  description text,
  priority text,
  habit_track boolean default false
);

create table if not exists subtasks (
  id text primary key,
  task_id text references tasks(id) on delete cascade,
  title text not null,
  done boolean default false
);

create table if not exists schedules (
  id text primary key,
  task_id text references tasks(id) on delete cascade,
  kind text not null check (kind in ('once','daily','weekly','custom_rrule')),
  weekly_by_day text[],
  duration_minutes integer,
  earliest_start time,
  latest_start time,
  rrule text,
  date date
);
create index if not exists schedules_task_id_idx on schedules(task_id);

create table if not exists habit_logs (
  task_id text references tasks(id) on delete cascade,
  day date not null,
  checked boolean default true,
  primary key (task_id, day)
);
create index if not exists habit_logs_task_id_idx on habit_logs(task_id);

-- App-wide JSON state for Writer's Dashboard (saves without auth)
create table if not exists app_state (
  id text primary key default 'singleton',
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

-- Optional: enable RLS and add policies if you add Auth
-- alter table categories enable row level security;
-- alter table goals enable row level security;
-- alter table tasks enable row level security;
-- alter table subtasks enable row level security;
-- alter table schedules enable row level security;
-- alter table habit_logs enable row level security;
-- Example policy once you add an owner_id uuid column and set it to auth.uid():
-- create policy "owners read/write" on tasks for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
