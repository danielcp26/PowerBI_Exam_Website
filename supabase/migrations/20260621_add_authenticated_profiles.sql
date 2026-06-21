-- Auth owns passwords and email addresses in auth.users. This table only stores public profile data.
alter table public.app_users add column if not exists auth_user_id uuid unique references auth.users(id) on delete cascade;
alter table public.app_users add column if not exists alias text;

-- Existing leaderboard views that select display_name will automatically expose the alias,
-- because the client writes the alias to both columns for authenticated profiles.

alter table public.app_users enable row level security;

drop policy if exists "Users can view their own profile" on public.app_users;
create policy "Users can view their own profile"
on public.app_users for select
to authenticated
using (auth.uid() = auth_user_id);

drop policy if exists "Users can create their own profile" on public.app_users;
create policy "Users can create their own profile"
on public.app_users for insert
to authenticated
with check (auth.uid() = auth_user_id);

drop policy if exists "Users can update their own profile" on public.app_users;
create policy "Users can update their own profile"
on public.app_users for update
to authenticated
using (auth.uid() = auth_user_id)
with check (auth.uid() = auth_user_id);
