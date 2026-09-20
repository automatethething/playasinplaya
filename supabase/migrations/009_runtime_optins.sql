create or replace function upsert_guide_opt_in(
  p_email text,
  p_consented_at timestamptz,
  p_deletion_token_hash text
)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  insert into public.opt_ins (email, consented_at, unsubscribed_at, deletion_token_hash)
  values (p_email, p_consented_at, null, p_deletion_token_hash)
  on conflict (email) do update
    set consented_at = excluded.consented_at,
      unsubscribed_at = null,
      deletion_token_hash = excluded.deletion_token_hash,
      updated_at = now();
end;
$$;

create or replace function unsubscribe_guide_opt_in(p_deletion_token_hash text)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  update public.opt_ins
  set unsubscribed_at = now(), updated_at = now()
  where deletion_token_hash = p_deletion_token_hash;
end;
$$;

create or replace function delete_guide_opt_in(p_deletion_token_hash text)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  delete from public.opt_ins where deletion_token_hash = p_deletion_token_hash;
end;
$$;

revoke all on function upsert_guide_opt_in(text, timestamptz, text) from public, anon, authenticated;
revoke all on function unsubscribe_guide_opt_in(text) from public, anon, authenticated;
revoke all on function delete_guide_opt_in(text) from public, anon, authenticated;
grant execute on function upsert_guide_opt_in(text, timestamptz, text) to app_runtime;
grant execute on function unsubscribe_guide_opt_in(text) to app_runtime;
grant execute on function delete_guide_opt_in(text) to app_runtime;
