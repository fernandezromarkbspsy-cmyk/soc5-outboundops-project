create table if not exists public.idempotency_keys (
  id bigint generated always as identity primary key,
  actor_id uuid not null references public.profiles(id) on delete cascade,
  request_method text not null,
  request_path text not null,
  idempotency_key text not null,
  request_hash text not null,
  response_status integer,
  response_body jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(actor_id, request_method, request_path, idempotency_key)
);

create table if not exists public.notification_outbox (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  target_role public.user_role,
  request_id uuid references public.requests(id) on delete cascade,
  event_type text not null,
  title text not null,
  body text not null,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (user_id is not null or target_role is not null)
);

create index if not exists notification_outbox_pending_idx on public.notification_outbox(processed_at, created_at);
