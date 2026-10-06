-- ============================================================
-- HisabKitab — Supabase Database Schema
-- Run this in the Supabase SQL Editor (Project > SQL Editor > New query)
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- TABLE: profiles (public user data, mirrors auth.users)
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'Traveller',
  email text,
  avatar_url text,
  phone text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  using (auth.role() = 'authenticated');

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile row when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- TABLE: trips
-- ============================================================
create table if not exists public.trips (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  destination text not null,
  start_date date,
  end_date date,
  expected_members int default 2,
  cover_emoji text default '🧳',
  created_by uuid references public.profiles(id) on delete set null,
  join_code text unique not null,
  invite_link text,
  created_at timestamptz default now()
);

alter table public.trips enable row level security;

-- Helper function: is the caller a member of this trip?
create or replace function public.is_trip_member(_trip_id uuid, _user_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.trip_members
    where trip_id = _trip_id and user_id = _user_id
  );
$$ language sql security definer stable;

-- Helper function: is the caller an admin of this trip?
create or replace function public.is_trip_admin(_trip_id uuid, _user_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.trip_members
    where trip_id = _trip_id and user_id = _user_id and role = 'admin'
  );
$$ language sql security definer stable;

create policy "Members can view their trips"
  on public.trips for select
  using (public.is_trip_member(id, auth.uid()));

create policy "Anyone authenticated can view a trip by join_code (for join preview)"
  on public.trips for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can create trips"
  on public.trips for insert
  with check (auth.uid() = created_by);

create policy "Only admin can update trip"
  on public.trips for update
  using (public.is_trip_admin(id, auth.uid()));

create policy "Only admin can delete trip"
  on public.trips for delete
  using (public.is_trip_admin(id, auth.uid()));

-- ============================================================
-- TABLE: trip_members
-- ============================================================
create table if not exists public.trip_members (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid references public.trips(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  joined_at timestamptz default now(),
  unique (trip_id, user_id)
);

alter table public.trip_members enable row level security;

create policy "Members can view trip member list"
  on public.trip_members for select
  using (public.is_trip_member(trip_id, auth.uid()));

create policy "Authenticated users can join a trip"
  on public.trip_members for insert
  with check (auth.uid() = user_id);

create policy "Admin can remove members, users can remove self"
  on public.trip_members for delete
  using (public.is_trip_admin(trip_id, auth.uid()) or user_id = auth.uid());

create policy "Admin can update member roles"
  on public.trip_members for update
  using (public.is_trip_admin(trip_id, auth.uid()));

-- ============================================================
-- TABLE: expenses
-- ============================================================
create table if not exists public.expenses (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid references public.trips(id) on delete cascade not null,
  paid_by_user_id uuid references public.profiles(id) on delete set null,
  added_by_user_id uuid references public.profiles(id) on delete set null,
  amount numeric(12,2) not null check (amount > 0),
  description text not null,
  category text not null default 'other' check (category in ('food','travel','stay','shopping','other')),
  expense_date date default current_date,
  receipt_url text,
  split_type text not null default 'equal' check (split_type in ('equal')),
  created_at timestamptz default now()
);

alter table public.expenses enable row level security;

create policy "Members can view trip expenses"
  on public.expenses for select
  using (public.is_trip_member(trip_id, auth.uid()));

create policy "Members can add expenses"
  on public.expenses for insert
  with check (public.is_trip_member(trip_id, auth.uid()) and added_by_user_id = auth.uid());

create policy "Members can update expenses they added, admin can update any"
  on public.expenses for update
  using (added_by_user_id = auth.uid() or public.is_trip_admin(trip_id, auth.uid()));

create policy "Members can delete expenses they added, admin can delete any"
  on public.expenses for delete
  using (added_by_user_id = auth.uid() or public.is_trip_admin(trip_id, auth.uid()));

-- ============================================================
-- TABLE: settlements (records of "Settle Up" actions)
-- ============================================================
create table if not exists public.settlements (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid references public.trips(id) on delete cascade not null,
  from_user_id uuid references public.profiles(id) on delete set null,
  to_user_id uuid references public.profiles(id) on delete set null,
  amount numeric(12,2) not null check (amount > 0),
  settled_at timestamptz default now(),
  note text
);

alter table public.settlements enable row level security;

create policy "Members can view settlements"
  on public.settlements for select
  using (public.is_trip_member(trip_id, auth.uid()));

create policy "Members can record a settlement"
  on public.settlements for insert
  with check (public.is_trip_member(trip_id, auth.uid()));

-- ============================================================
-- STORAGE: bucket for receipt photos
-- ============================================================
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', true)
on conflict (id) do nothing;

create policy "Authenticated users can upload receipts"
  on storage.objects for insert
  with check (bucket_id = 'receipts' and auth.role() = 'authenticated');

create policy "Anyone can view receipts (public bucket)"
  on storage.objects for select
  using (bucket_id = 'receipts');

-- ============================================================
-- REALTIME: enable for live updates on expenses/members/balances
-- ============================================================
alter publication supabase_realtime add table public.expenses;
alter publication supabase_realtime add table public.trip_members;
alter publication supabase_realtime add table public.settlements;

-- ============================================================
-- UTILITY: generate a unique 6-character join code (e.g. GOA123)
-- Call from the app after inserting trip name prefix, or use this
-- SQL function directly from the client via rpc('generate_join_code').
-- ============================================================
create or replace function public.generate_join_code(prefix text default '')
returns text as $$
declare
  code text;
  clean_prefix text;
  exists_already boolean;
begin
  clean_prefix := upper(regexp_replace(coalesce(prefix, ''), '[^A-Za-z]', '', 'g'));
  clean_prefix := left(clean_prefix, 3);
  loop
    code := clean_prefix || lpad(floor(random() * 1000)::text, 3, '0');
    select exists(select 1 from public.trips where join_code = code) into exists_already;
    exit when not exists_already;
  end loop;
  return code;
end;
$$ language plpgsql;

-- ============================================================
-- INDEXES for performance
-- ============================================================
create index if not exists idx_trip_members_trip on public.trip_members(trip_id);
create index if not exists idx_trip_members_user on public.trip_members(user_id);
create index if not exists idx_expenses_trip on public.expenses(trip_id);
create index if not exists idx_settlements_trip on public.settlements(trip_id);
create index if not exists idx_trips_join_code on public.trips(join_code);
