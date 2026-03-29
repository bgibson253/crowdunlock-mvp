-- Adjust trust level post limits in compute_user_trust comments
-- Actual enforcement happens in app code, but document the intended levels here.

-- Trust Level Definitions (enforced in application layer):
-- Level 0 (Newbie):  0-99 score.   10 posts/day. Text-only. React.
-- Level 1 (Member):  100-299.      50 posts/day. Reply, search, flag content, vote on tags.
-- Level 2 (Regular): 300-599.      Unlimited text. Images (AI-scanned), polls.
-- Level 3 (Trusted): 600-899.      Embed video links (YouTube, Vimeo, etc.) in posts.
-- Level 4 (Leader):  900+.         Can create exactly 1 forum topic (lifetime). Pin threads.
--
-- NO trust level grants full mod dashboard access.
-- Mod dashboard is admin-only (separate admin flag, not trust-based).

-- Add admin flag to profiles for dashboard access control
alter table public.profiles add column if not exists is_admin boolean not null default false;
