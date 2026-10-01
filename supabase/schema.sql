create table public.finance_snapshots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.parent_access (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid references auth.users(id) on delete set null,
  parent_email text not null,
  invite_token uuid not null default gen_random_uuid(),
  status text not null default 'pending' check (status in ('pending', 'approved', 'revoked')),
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  unique (child_id, parent_email)
);

alter table public.finance_snapshots enable row level security;
alter table public.parent_access enable row level security;

create policy "Users manage their own finance snapshot"
  on public.finance_snapshots for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Approved parents can read child snapshots"
  on public.finance_snapshots for select
  using (
    exists (
      select 1 from public.parent_access
      where parent_access.child_id = finance_snapshots.user_id
        and parent_access.parent_id = auth.uid()
        and parent_access.status = 'approved'
    )
  );

create policy "Children manage their sharing requests"
  on public.parent_access for all
  using (auth.uid() = child_id)
  with check (auth.uid() = child_id);

create policy "Parents view their invitations"
  on public.parent_access for select
  using (auth.uid() = parent_id);

create policy "Parents approve their invitations"
  on public.parent_access for update
  using (auth.uid() = parent_id and status = 'pending')
  with check (auth.uid() = parent_id and status = 'approved');

create index parent_access_parent_id_idx on public.parent_access(parent_id);
create index parent_access_child_id_idx on public.parent_access(child_id);