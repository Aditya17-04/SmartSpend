-- Migration: Fix parent access RLS policies to work correctly in Supabase
-- Run this in the Supabase SQL editor

-- ── parent_access policies ──────────────────────────────────────────────────
-- Drop existing policies that only match by parent_id (breaks pending invites
-- because parent_id is NULL until the parent approves)
drop policy if exists "Parents view their invitations" on public.parent_access;
drop policy if exists "Parents approve their invitations" on public.parent_access;
drop policy if exists "Children manage their sharing requests" on public.parent_access;

-- Allow children to manage their sharing requests
create policy "Children manage their sharing requests"
  on public.parent_access for all
  using (auth.uid() = child_id)
  with check (auth.uid() = child_id);

-- Allow parent to see their invite whether it was matched by UUID or email
create policy "Parents view their invitations"
  on public.parent_access for select
  using (
    auth.uid() = parent_id
    or lower(coalesce(auth.jwt() ->> 'email', '')) = lower(parent_email)
  );

-- Allow parent to approve or link their own invite (matched by UUID or email)
create policy "Parents approve their invitations"
  on public.parent_access for update
  using (
    auth.uid() = parent_id
    or lower(coalesce(auth.jwt() ->> 'email', '')) = lower(parent_email)
  )
  with check (
    auth.uid() = parent_id
  );

-- ── finance_snapshots policy ────────────────────────────────────────────────
-- Drop existing policies
drop policy if exists "Users manage their own finance snapshot" on public.finance_snapshots;
drop policy if exists "Approved parents can read child snapshots" on public.finance_snapshots;

-- Allow users to manage their own finance snapshot
create policy "Users manage their own finance snapshot"
  on public.finance_snapshots for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Allow approved parents to read child snapshots (handles matching by parent_id OR email in JWT)
create policy "Approved parents can read child snapshots"
  on public.finance_snapshots for select
  using (
    exists (
      select 1 from public.parent_access
      where parent_access.child_id = finance_snapshots.user_id
        and (
          parent_access.parent_id = auth.uid()
          or lower(parent_access.parent_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
        and parent_access.status = 'approved'
    )
  );
