create extension if not exists vector;

create table teachers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text not null,
  created_at timestamptz default now()
);

create table children (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references teachers(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

create table check_ins (
  id uuid primary key default gen_random_uuid(),
  child_id uuid references children(id) on delete cascade,
  audio_url text,
  transcript text,
  emotion_data jsonb,
  drift_score float,
  created_at timestamptz default now()
);

create table embeddings (
  id uuid primary key default gen_random_uuid(),
  check_in_id uuid references check_ins(id) on delete cascade,
  child_id uuid references children(id) on delete cascade,
  embedding vector(768),
  created_at timestamptz default now()
);

create table flags (
  id uuid primary key default gen_random_uuid(),
  child_id uuid references children(id) on delete cascade,
  check_in_id uuid references check_ins(id) on delete cascade,
  status text check (status in ('warning', 'alert')) not null,
  reason text,
  resolved boolean default false,
  created_at timestamptz default now()
);

create table weekly_summaries (
  id uuid primary key default gen_random_uuid(),
  child_id uuid references children(id) on delete cascade,
  week_start date not null,
  summary_text text,
  created_at timestamptz default now()
);

-- HNSW index works well on small-to-medium datasets without needing minimum row counts
create index on embeddings using hnsw (embedding vector_cosine_ops);

-- Seed a default teacher for development (fixed UUID so frontend can reference it)
insert into teachers (id, email, name)
values ('11111111-1111-1111-1111-111111111111', 'teacher@tilli.kids', 'Demo Teacher');
