-- Existing rows may predate URL hashing. Keep those rows nullable rather than inventing hashes.
-- For duplicate hashes, retain the earliest submission (created_at, id) as the canonical idempotency record
-- and clear the later rows' hashes. This preserves all historical submissions without deleting them.
with ranked_submissions as (
  select id, row_number() over (
    partition by normalized_url_hash
    order by created_at asc, id asc
  ) as row_number
  from submissions
  where normalized_url_hash is not null
)
update submissions
set normalized_url_hash = null
where id in (select id from ranked_submissions where row_number > 1);

alter table submissions
  add constraint submissions_normalized_url_hash_key unique (normalized_url_hash);

drop index if exists submissions_normalized_url_hash_idx;

-- Existing opt-ins cannot receive usable deletion tokens because their raw tokens were never stored.
-- Leave them nullable; new opt-ins always write a hash, and null rows cannot be deleted by token.
alter table opt_ins
  add column deletion_token_hash text;

create unique index opt_ins_deletion_token_hash_key
  on opt_ins (deletion_token_hash)
  where deletion_token_hash is not null;
