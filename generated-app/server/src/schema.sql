-- Idempotent schema
-- gen_random_uuid() is built into PostgreSQL 13+ (no extension needed)

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  bio text not null default '',
  goals_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  doc_type text not null,
  tax_year int,
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists extracted_fields (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  field_key text not null,
  field_label text not null default '',
  value_num numeric,
  value_text text,
  created_at timestamptz not null default now()
);

create table if not exists recommendations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  rule_id text not null,
  title text not null,
  insight text not null,
  score numeric not null,
  calculations_json jsonb not null default '{}'::jsonb,
  evidence_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists export_packages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  package_json jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_documents_client on documents(client_id);
create index if not exists idx_recs_client on recommendations(client_id);
