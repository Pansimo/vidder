-- Storage bucket for curated hero images
-- Kör manuellt i Supabase Studio (SQL Editor)

insert into storage.buckets (id, name, public)
values ('curated-images', 'curated-images', true)
on conflict (id) do nothing;

create policy "Curators can upload curated images"
  on storage.objects for insert
  with check (bucket_id = 'curated-images' and public.is_curator());

create policy "Curators can update curated images"
  on storage.objects for update
  using (bucket_id = 'curated-images' and public.is_curator())
  with check (bucket_id = 'curated-images' and public.is_curator());

create policy "Curators can delete curated images"
  on storage.objects for delete
  using (bucket_id = 'curated-images' and public.is_curator());
