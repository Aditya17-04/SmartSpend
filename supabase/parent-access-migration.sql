drop policy if exists "Parents view their invitations" on public.parent_access;
drop policy if exists "Parents approve their invitations" on public.parent_access;

create policy "Parents view their invitations"
  on public.parent_access for select
  using (
    auth.uid() = parent_id
    or lower(auth.email()) = lower(parent_email)
  );

create policy "Parents approve their invitations"
  on public.parent_access for update
  using (
    (auth.uid() = parent_id or lower(auth.email()) = lower(parent_email))
    and status = 'pending'
  )
  with check (auth.uid() = parent_id and status = 'approved');