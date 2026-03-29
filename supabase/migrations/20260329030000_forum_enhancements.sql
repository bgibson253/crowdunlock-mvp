-- Forum enhancements: edit/delete, view count, locking, pinning, last activity

-- Soft delete
ALTER TABLE forum_threads ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
ALTER TABLE forum_replies ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- Edit tracking
ALTER TABLE forum_threads ADD COLUMN IF NOT EXISTS edited_at timestamptz DEFAULT NULL;
ALTER TABLE forum_replies ADD COLUMN IF NOT EXISTS edited_at timestamptz DEFAULT NULL;

-- View count
ALTER TABLE forum_threads ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0 NOT NULL;

-- Locking
ALTER TABLE forum_threads ADD COLUMN IF NOT EXISTS locked boolean DEFAULT false NOT NULL;

-- Pinning
ALTER TABLE forum_threads ADD COLUMN IF NOT EXISTS pinned boolean DEFAULT false NOT NULL;

-- Last activity
ALTER TABLE forum_threads ADD COLUMN IF NOT EXISTS last_activity_at timestamptz DEFAULT NOW();
-- Backfill: set last_activity_at to latest reply or created_at
UPDATE forum_threads SET last_activity_at = COALESCE(
  (SELECT MAX(created_at) FROM forum_replies WHERE thread_id = forum_threads.id AND deleted_at IS NULL),
  created_at
);

-- Trigger: update last_activity_at on new reply
CREATE OR REPLACE FUNCTION update_thread_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE forum_threads SET last_activity_at = NEW.created_at WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_reply_update_activity ON forum_replies;
CREATE TRIGGER on_reply_update_activity
  AFTER INSERT ON forum_replies
  FOR EACH ROW
  EXECUTE FUNCTION update_thread_last_activity();

-- RPC: increment view count
CREATE OR REPLACE FUNCTION increment_view_count(thread_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE forum_threads SET view_count = view_count + 1 WHERE id = thread_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
