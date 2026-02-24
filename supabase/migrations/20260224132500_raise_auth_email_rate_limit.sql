-- Raise auth email sending rate limit to reduce reset friction during testing.
-- Note: This uses a helper exposed by Supabase Auth. No-op if unavailable.

DO $$
BEGIN
  -- Try both possible function locations; ignore if not present.
  BEGIN
    PERFORM auth.set_config('rate_limit.email_sent', '20');
  EXCEPTION WHEN undefined_function THEN
    BEGIN
      PERFORM auth.set_config('rate_limit.email_sent', '20');
    EXCEPTION WHEN others THEN
      -- ignore
    END;
  END;
END $$;
