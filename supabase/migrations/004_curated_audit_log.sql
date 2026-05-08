-- Curated audit log: spårar alla ändringar i curated_*-tabeller
-- Kör manuellt i Supabase Studio (SQL Editor)

-- Tabell
create table public.curated_audit_log (
  id           uuid primary key default gen_random_uuid(),
  table_name   text not null,
  record_id    text not null,
  operation    text not null check (operation in ('insert','update','delete')),
  changed_by   uuid references auth.users(id),
  changed_at   timestamptz not null default now(),
  diff         jsonb
);

-- Index
create index idx_audit_table_record on public.curated_audit_log (table_name, record_id, changed_at desc);
create index idx_audit_user on public.curated_audit_log (changed_by, changed_at desc);

-- RLS
alter table public.curated_audit_log enable row level security;

create policy "Admin read audit log"
  on public.curated_audit_log for select
  using (exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.is_admin = true
  ));

-- Trigger-funktion (SECURITY DEFINER — skriver utan RLS-check)
create or replace function public.fn_curated_audit_log()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.curated_audit_log (table_name, record_id, operation, changed_by, diff)
  values (
    TG_TABLE_NAME,
    coalesce(NEW.id::text, OLD.id::text),
    lower(TG_OP),
    auth.uid(),
    case TG_OP
      when 'INSERT' then jsonb_build_object('after', to_jsonb(NEW))
      when 'UPDATE' then jsonb_build_object('before', to_jsonb(OLD), 'after', to_jsonb(NEW))
      when 'DELETE' then jsonb_build_object('before', to_jsonb(OLD))
    end
  );
  return coalesce(NEW, OLD);
end;
$$;

-- Triggers
create trigger trg_audit_curated_areas
  after insert or update or delete on public.curated_areas
  for each row execute function public.fn_curated_audit_log();

create trigger trg_audit_curated_pois
  after insert or update or delete on public.curated_pois
  for each row execute function public.fn_curated_audit_log();

create trigger trg_audit_curated_collections
  after insert or update or delete on public.curated_collections
  for each row execute function public.fn_curated_audit_log();

create trigger trg_audit_curated_poi_collections
  after insert or update or delete on public.curated_poi_collections
  for each row execute function public.fn_curated_audit_log();
