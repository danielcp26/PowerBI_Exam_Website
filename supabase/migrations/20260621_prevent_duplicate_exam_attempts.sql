-- Keep one copy of each previously duplicated submission, then prevent repeats.
with ranked_attempts as (
  select
    id,
    row_number() over (
      partition by user_id, started_at
      order by created_at asc, id asc
    ) as duplicate_rank
  from public.exam_attempts
)
delete from public.attempt_answers
where attempt_id in (select id from ranked_attempts where duplicate_rank > 1);

with ranked_attempts as (
  select
    id,
    row_number() over (
      partition by user_id, started_at
      order by created_at asc, id asc
    ) as duplicate_rank
  from public.exam_attempts
)
delete from public.exam_attempts
where id in (select id from ranked_attempts where duplicate_rank > 1);

create unique index if not exists exam_attempts_one_submission_per_session
on public.exam_attempts (user_id, started_at);
