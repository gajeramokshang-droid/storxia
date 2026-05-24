
-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)));
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Folders
create table public.folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid references public.folders(id) on delete cascade,
  name text not null,
  path text not null default '',
  created_at timestamptz not null default now()
);
create index folders_user_idx on public.folders(user_id);
create index folders_parent_idx on public.folders(parent_id);
alter table public.folders enable row level security;
create policy "folders owner all" on public.folders for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Files
create table public.files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  folder_id uuid references public.folders(id) on delete cascade,
  name text not null,
  rel_path text not null default '',
  size bigint not null default 0,
  mime_type text,
  storage_path text not null,
  created_at timestamptz not null default now()
);
create index files_user_idx on public.files(user_id);
create index files_folder_idx on public.files(folder_id);
alter table public.files enable row level security;
create policy "files owner all" on public.files for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Storage bucket
insert into storage.buckets (id, name, public, file_size_limit)
values ('uploads', 'uploads', false, 52428800)
on conflict (id) do nothing;

create policy "uploads read own" on storage.objects for select
  using (bucket_id = 'uploads' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "uploads insert own" on storage.objects for insert
  with check (bucket_id = 'uploads' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "uploads update own" on storage.objects for update
  using (bucket_id = 'uploads' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "uploads delete own" on storage.objects for delete
  using (bucket_id = 'uploads' and auth.uid()::text = (storage.foldername(name))[1]);
