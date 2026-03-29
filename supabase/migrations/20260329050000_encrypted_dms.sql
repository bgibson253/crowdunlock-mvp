-- E2E encrypted DMs: store user public keys and encrypted message bodies

-- Public key storage for E2E encryption
create table if not exists public.user_public_keys (
  user_id uuid primary key references auth.users(id) on delete cascade,
  public_key text not null, -- base64-encoded ECDH public key (P-256)
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.user_public_keys enable row level security;

-- Anyone can read public keys (needed to encrypt messages to a user)
create policy user_public_keys_select on public.user_public_keys
  for select using (true);

-- Users can insert/update their own key
create policy user_public_keys_insert on public.user_public_keys
  for insert to authenticated with check (auth.uid() = user_id);

create policy user_public_keys_update on public.user_public_keys
  for update to authenticated using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Add encrypted fields to forum_dms
-- encrypted_body: base64 ciphertext (AES-256-GCM)
-- nonce: base64 IV for AES-GCM
-- encrypted: boolean flag to distinguish legacy plaintext from encrypted
alter table public.forum_dms add column if not exists encrypted_body text;
alter table public.forum_dms add column if not exists nonce text;
alter table public.forum_dms add column if not exists encrypted boolean default false not null;

-- Remove the body length check for encrypted messages (body will be '[encrypted]' placeholder)
-- We need to keep body non-null for backward compat, but encrypted msgs store '[encrypted]'
