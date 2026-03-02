create table pois (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references auth.users on delete cascade not null,
  title         text default '',
  note          text,
  lat           double precision not null,
  lng           double precision not null,
  location_type text default 'point',
  radius_m      integer,
  bearing_deg   integer,
  visibility    text default 'private',
  visited_at    timestamp with time zone,
  created_at    timestamp with time zone default now(),
  updated_at    timestamp with time zone default now()
);

alter table pois enable row level security;

create policy "Users can view own pois"
  on pois for select using (auth.uid() = user_id);

create policy "Users can insert own pois"
  on pois for insert with check (auth.uid() = user_id);

create policy "Users can update own pois"
  on pois for update using (auth.uid() = user_id);

create policy "Users can delete own pois"
  on pois for delete using (auth.uid() = user_id);

create index pois_user_id_idx on pois (user_id);
create index pois_created_at_idx on pois (created_at desc);
