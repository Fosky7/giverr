-- Module 3, Step 2a: Auto-provision a profile row on user signup
--
-- Adds a SECURITY DEFINER function that runs whenever a new row is inserted
-- into auth.users (email/password OR social login). It creates a matching
-- public.profiles row, pulling display name and avatar from the provider
-- metadata when available. This guarantees every user has a profile.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    -- Prefer an explicit full_name, then common social provider keys.
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'user_name'
    ),
    -- Prefer avatar_url, then Google/Facebook 'picture'.
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Attach the trigger to auth.users.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
