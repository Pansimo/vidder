-- poi_images table
create table poi_images (
  id           uuid default gen_random_uuid() primary key,
  poi_id       uuid references pois on delete cascade not null,
  user_id      uuid references auth.users on delete cascade not null,
  storage_path text not null,
  created_at   timestamp with time zone default now()
);

alter table poi_images enable row level security;

create policy "Users can view own poi images"
  on poi_images for select using (auth.uid() = user_id);

create policy "Users can insert own poi images"
  on poi_images for insert with check (auth.uid() = user_id);

create policy "Users can delete own poi images"
  on poi_images for delete using (auth.uid() = user_id);

-- Trigger: auto-update pois.updated_at on edit
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger pois_updated_at
  before update on pois
  for each row execute procedure update_updated_at();

-- Storage: create poi-images bucket (public) and RLS policies
insert into storage.buckets (id, name, public)
values ('poi-images', 'poi-images', true)
on conflict (id) do nothing;

create policy "Users can upload their own images"
  on storage.objects for insert
  with check (
    bucket_id = 'poi-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own images"
  on storage.objects for delete
  using (
    bucket_id = 'poi-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
