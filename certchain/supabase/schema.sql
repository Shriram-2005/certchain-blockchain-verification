-- ============================================================
--  CertChain — Supabase PostgreSQL Schema
--  Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ── Enable UUID extension ────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── 1. Certificates (metadata mirror of blockchain data) ─────
create table public.certificates (
  id               uuid primary key default gen_random_uuid(),
  cert_id          text unique not null,
  holder_name      text not null,
  holder_email     text not null,
  cert_type        text not null,
  institution      text not null,
  issued_by        uuid references auth.users on delete set null,
  tx_hash          text,
  block_number     bigint,
  storage_path     text,                    -- Supabase Storage path for PDF
  cert_hash        text not null,           -- SHA-256 of cert content
  fraud_score      integer default 0,
  status           text default 'ACTIVE',   -- ACTIVE | REVOKED | SUSPENDED
  issued_at        timestamptz default now(),
  expires_at       timestamptz,
  revoked_at       timestamptz,
  revocation_reason text,
  metadata         jsonb default '{}'::jsonb  -- degree, grade, year, etc.
);

-- ── 2. Audit Logs (mirrors on-chain logs for fast UI queries) ─
create table public.audit_logs (
  id         uuid primary key default gen_random_uuid(),
  cert_id    text not null,
  action     text not null,   -- ISSUED | REVOKED | SUSPENDED | REINSTATED
  reason     text,
  actor_id   uuid references auth.users on delete set null,
  tx_hash    text,
  created_at timestamptz default now()
);

-- ── 3. Fraud Logs (AI validation records) ────────────────────
create table public.fraud_logs (
  id             uuid primary key default gen_random_uuid(),
  cert_id        text,
  fraud_score    integer,
  flags          text[],
  recommendation text,
  reviewed_by    uuid references auth.users on delete set null,
  reviewed_at    timestamptz,
  submitted_at   timestamptz default now()
);

-- ── Indexes ───────────────────────────────────────────────────
create index idx_certificates_cert_id   on public.certificates (cert_id);
create index idx_certificates_status    on public.certificates (status);
create index idx_certificates_issued_at on public.certificates (issued_at desc);
create index idx_audit_logs_cert_id     on public.audit_logs (cert_id);

-- ── Row Level Security ────────────────────────────────────────
alter table public.certificates enable row level security;
alter table public.audit_logs   enable row level security;
alter table public.fraud_logs   enable row level security;

-- Issuers can read all certificates, insert new ones
create policy "Authenticated users can read certificates"
  on public.certificates for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can insert certificates"
  on public.certificates for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update certificates"
  on public.certificates for update
  using (auth.role() = 'authenticated');

-- Audit logs: authenticated read + insert
create policy "Authenticated users can read audit logs"
  on public.audit_logs for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can insert audit logs"
  on public.audit_logs for insert
  with check (auth.role() = 'authenticated');

-- Fraud logs: authenticated read + insert
create policy "Authenticated users can read fraud logs"
  on public.fraud_logs for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can insert fraud logs"
  on public.fraud_logs for insert
  with check (auth.role() = 'authenticated');


-- ── Supabase Storage: Create "certificates" bucket ───────────
-- Run this separately OR do it via Supabase Dashboard → Storage → New bucket
insert into storage.buckets (id, name, public)
values ('certificates', 'certificates', true)
on conflict (id) do nothing;

-- Storage policy: anyone can read (for PDF download links)
create policy "Public read access for certificate PDFs"
  on storage.objects for select
  using (bucket_id = 'certificates');

-- Storage policy: authenticated users can upload
create policy "Authenticated users can upload certificate PDFs"
  on storage.objects for insert
  with check (bucket_id = 'certificates' and auth.role() = 'authenticated');


-- ── Seed: Create admin user (optional) ───────────────────────
-- After running this schema, create users via:
-- Supabase Dashboard → Authentication → Users → Invite user
-- Then update their metadata:
-- update auth.users set raw_user_meta_data = '{"role": "admin"}' where email = 'admin@certchain.gov';
-- update auth.users set raw_user_meta_data = '{"role": "issuer"}' where email = 'officer@certchain.gov';
