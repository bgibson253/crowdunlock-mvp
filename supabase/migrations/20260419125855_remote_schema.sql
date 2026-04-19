drop trigger if exists "trg_notify_followers_on_live" on "public"."live_rooms";

alter table "public"."live_tips" drop constraint "live_tips_live_room_fk";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.increment_view_count(thread_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE forum_threads SET view_count = view_count + 1 WHERE id = thread_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_thread_last_activity()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE forum_threads SET last_activity_at = NEW.created_at WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$function$
;

CREATE TRIGGER on_reply_update_activity AFTER INSERT ON public.forum_replies FOR EACH ROW EXECUTE FUNCTION public.update_thread_last_activity();


