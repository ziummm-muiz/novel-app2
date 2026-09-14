-- ====================================================================
-- Novel-App Migration: Priority One Security & Foundation Fixes
-- File: supabase/migrations/20260914_priority_one_security.sql
-- Description:
--   1. Schema assertions to ensure clean target state
--   2. chapters: Fix RLS so only novel authors or admins can edit/delete
--   3. profiles: Restrict UPDATE, prevent is_admin/is_restricted self-escalation
--   4. novels: Move admin policy to authenticated, optimize author checks
--   5. Reassign public write policies to authenticated with (SELECT auth.uid())
--   6. handle_new_user: Fix search_path, revoke execution from public/anon/authenticated
--   7. notifications: Eliminate broad insert policy, add secure create_notification
--      and notify_chapter_published SECURITY DEFINER functions
--   8. storage.objects: Isolate user uploads (covers, avatars) by user ID prefix
--   9. Dead tables: Add baseline RLS policies to clear linter warnings
--  10. Drop redundant public.follows table (dependencies verified)
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. Schema Assertions
-- --------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    RAISE EXCEPTION 'Assertion failed: table public.profiles does not exist';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'novels') THEN
    RAISE EXCEPTION 'Assertion failed: table public.novels does not exist';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chapters') THEN
    RAISE EXCEPTION 'Assertion failed: table public.chapters does not exist';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'followers') THEN
    RAISE EXCEPTION 'Assertion failed: table public.followers does not exist';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
    RAISE EXCEPTION 'Assertion failed: table public.notifications does not exist';
  END IF;
END $$;

-- --------------------------------------------------------------------
-- 2. chapters: Fix Critical RLS Ownership Hole
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "allow users edit chapters" ON public.chapters;
DROP POLICY IF EXISTS "authors and admins can manage chapters" ON public.chapters;

CREATE POLICY "authors and admins can manage chapters"
ON public.chapters FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.novels
    WHERE novels.id = chapters.novel_id
      AND (
        novels.author_id = (SELECT auth.uid())
        OR EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = (SELECT auth.uid()) AND profiles.is_admin = true
        )
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.novels
    WHERE novels.id = chapters.novel_id
      AND (
        novels.author_id = (SELECT auth.uid())
        OR EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = (SELECT auth.uid()) AND profiles.is_admin = true
        )
      )
  )
);

-- --------------------------------------------------------------------
-- 3. profiles: Restrict UPDATE & Prevent Privilege Escalation
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "allow users edit profiles" ON public.profiles;
DROP POLICY IF EXISTS "users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "users can insert own profile" ON public.profiles;

CREATE POLICY "users can update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (
  (SELECT auth.uid()) = id
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (SELECT auth.uid()) AND profiles.is_admin = true
  )
)
WITH CHECK (
  (SELECT auth.uid()) = id
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (SELECT auth.uid()) AND profiles.is_admin = true
  )
);

CREATE POLICY "users can insert own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) = id);

CREATE OR REPLACE FUNCTION public.prevent_is_admin_self_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid;
  v_caller_is_admin boolean;
BEGIN
  v_caller_id := auth.uid();

  -- Allow modifications if run without authenticated user context (e.g. service_role, migrations)
  IF v_caller_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check if caller has is_admin = true
  SELECT is_admin INTO v_caller_is_admin
  FROM public.profiles
  WHERE id = v_caller_id;

  -- Protect is_admin
  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
    IF v_caller_is_admin IS NOT TRUE THEN
      RAISE EXCEPTION 'Unauthorized: only existing administrators can grant or revoke admin status.';
    END IF;

    IF NEW.id = v_caller_id AND NEW.is_admin = false THEN
      RAISE EXCEPTION 'Bad Request: administrators cannot revoke their own admin status to prevent accidental lockout.';
    END IF;
  END IF;

  -- Protect is_restricted
  IF NEW.is_restricted IS DISTINCT FROM OLD.is_restricted THEN
    IF v_caller_is_admin IS NOT TRUE THEN
      RAISE EXCEPTION 'Unauthorized: only administrators can change user restriction status.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_is_admin_self_escalation ON public.profiles;

CREATE TRIGGER trg_prevent_is_admin_self_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_is_admin_self_escalation();

REVOKE EXECUTE ON FUNCTION public.prevent_is_admin_self_escalation() FROM PUBLIC, anon, authenticated;

-- --------------------------------------------------------------------
-- 4. novels: Move Admin Policy to Authenticated & Optimize Author Access
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "allow admins to update novels" ON public.novels;
DROP POLICY IF EXISTS "allow authors insert novels" ON public.novels;
DROP POLICY IF EXISTS "authors can manage own novels" ON public.novels;
DROP POLICY IF EXISTS "admins can manage all novels" ON public.novels;

CREATE POLICY "authors can manage own novels"
ON public.novels FOR ALL TO authenticated
USING      ((SELECT auth.uid()) = author_id)
WITH CHECK ((SELECT auth.uid()) = author_id);

CREATE POLICY "admins can manage all novels"
ON public.novels FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (SELECT auth.uid()) AND profiles.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (SELECT auth.uid()) AND profiles.is_admin = true
  )
);

-- --------------------------------------------------------------------
-- 5. Reassign Write Policies from {public} to {authenticated}
-- --------------------------------------------------------------------
-- comments
DROP POLICY IF EXISTS "Allow authenticated insert/update/delete on comments" ON public.comments;
DROP POLICY IF EXISTS "authenticated users can manage own comments" ON public.comments;
CREATE POLICY "authenticated users can manage own comments"
ON public.comments FOR ALL TO authenticated
USING      ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- comment_likes
DROP POLICY IF EXISTS "Allow authenticated insert/delete on comment_likes" ON public.comment_likes;
DROP POLICY IF EXISTS "authenticated users can manage own comment likes" ON public.comment_likes;
CREATE POLICY "authenticated users can manage own comment likes"
ON public.comment_likes FOR ALL TO authenticated
USING      ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- reviews
DROP POLICY IF EXISTS "Allow authenticated insert/update/delete on reviews" ON public.reviews;
DROP POLICY IF EXISTS "authenticated users can manage own reviews" ON public.reviews;
CREATE POLICY "authenticated users can manage own reviews"
ON public.reviews FOR ALL TO authenticated
USING      ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- user_library
DROP POLICY IF EXISTS "Allow user own library access" ON public.user_library;
DROP POLICY IF EXISTS "authenticated users can manage own library" ON public.user_library;
CREATE POLICY "authenticated users can manage own library"
ON public.user_library FOR ALL TO authenticated
USING      ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- reading_history
DROP POLICY IF EXISTS "Allow user own reading history access" ON public.reading_history;
DROP POLICY IF EXISTS "authenticated users can manage own reading history" ON public.reading_history;
CREATE POLICY "authenticated users can manage own reading history"
ON public.reading_history FOR ALL TO authenticated
USING      ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- followers
DROP POLICY IF EXISTS "Users can manage their own follows" ON public.followers;
DROP POLICY IF EXISTS "users can manage own follows" ON public.followers;
CREATE POLICY "users can manage own follows"
ON public.followers FOR ALL TO authenticated
USING      ((SELECT auth.uid()) = follower_id)
WITH CHECK ((SELECT auth.uid()) = follower_id);

-- --------------------------------------------------------------------
-- 6. handle_new_user: Security Hardening
-- --------------------------------------------------------------------
ALTER FUNCTION public.handle_new_user() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

-- --------------------------------------------------------------------
-- 7. notifications: Event-Driven Trigger Architecture (Zero REST Exposure)
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Internal helper function to insert notifications (SECURITY DEFINER, public search_path, only callable internally)
CREATE OR REPLACE FUNCTION public.internal_create_notification(
  p_user_id uuid,
  p_title text,
  p_content text,
  p_link text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.notifications (user_id, title, content, link, is_read, created_at)
  VALUES (p_user_id, trim(p_title), trim(p_content), p_link, false, now());
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'internal_create_notification failed for user %: %', p_user_id, SQLERRM;
END;
$$;

-- 1. Trigger on followers
CREATE OR REPLACE FUNCTION public.trg_notify_on_follow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_follower_name text;
BEGIN
  IF NEW.follower_id = NEW.following_id THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(username, 'Someone') INTO v_follower_name
  FROM public.profiles
  WHERE id = NEW.follower_id;

  PERFORM public.internal_create_notification(
    NEW.following_id,
    'New Follower',
    COALESCE(v_follower_name, 'Someone') || ' started following you!',
    '/user/' || NEW.follower_id::text
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_follow ON public.followers;
CREATE TRIGGER trg_notify_follow
AFTER INSERT ON public.followers
FOR EACH ROW EXECUTE FUNCTION public.trg_notify_on_follow();

-- 2. Trigger on chapters (notify novel readers)
CREATE OR REPLACE FUNCTION public.trg_notify_on_chapter_published()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_novel_title text;
  v_novel_author_id uuid;
BEGIN
  IF NEW.status = 'published' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'published') THEN
    SELECT title, author_id INTO v_novel_title, v_novel_author_id
    FROM public.novels
    WHERE id = NEW.novel_id;

    IF v_novel_title IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, content, link, is_read, created_at)
      SELECT 
        ul.user_id,
        'New Chapter: ' || v_novel_title,
        'Chapter ' || NEW.chapter_number || ': ' || COALESCE(NEW.title, 'New Chapter') || ' has been published!',
        '/novel/' || NEW.novel_id::text,
        false,
        now()
      FROM public.user_library ul
      WHERE ul.novel_id = NEW.novel_id
        AND ul.status IN ('reading', 'favourite')
        AND ul.user_id <> COALESCE(v_novel_author_id, '00000000-0000-0000-0000-000000000000'::uuid);
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'trg_notify_on_chapter_published failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_chapter_published ON public.chapters;
CREATE TRIGGER trg_notify_chapter_published
AFTER INSERT OR UPDATE OF status ON public.chapters
FOR EACH ROW EXECUTE FUNCTION public.trg_notify_on_chapter_published();

-- 3. Trigger on reviews
CREATE OR REPLACE FUNCTION public.trg_notify_on_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_novel_title text;
  v_author_id uuid;
BEGIN
  SELECT title, author_id INTO v_novel_title, v_author_id
  FROM public.novels
  WHERE id = NEW.novel_id;

  IF v_author_id IS NOT NULL AND v_author_id <> NEW.user_id THEN
    PERFORM public.internal_create_notification(
      v_author_id,
      'New Review',
      'Someone left a ' || NEW.rating || '-star review on your novel "' || COALESCE(v_novel_title, 'Untitled') || '".',
      '/novel/' || NEW.novel_id::text
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_review ON public.reviews;
CREATE TRIGGER trg_notify_review
AFTER INSERT ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.trg_notify_on_review();

-- 4. Trigger on comments
CREATE OR REPLACE FUNCTION public.trg_notify_on_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_parent_author_id uuid;
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    SELECT user_id INTO v_parent_author_id
    FROM public.comments
    WHERE id = NEW.parent_id;

    IF v_parent_author_id IS NOT NULL AND v_parent_author_id <> NEW.user_id THEN
      PERFORM public.internal_create_notification(
        v_parent_author_id,
        'New Reply',
        'Someone replied to your comment.',
        '/novel/' || NEW.target_id::text
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_comment ON public.comments;
CREATE TRIGGER trg_notify_comment
AFTER INSERT ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.trg_notify_on_comment();

-- 5. Trigger on comment_likes
CREATE OR REPLACE FUNCTION public.trg_notify_on_comment_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_comment_author_id uuid;
BEGIN
  SELECT user_id INTO v_comment_author_id
  FROM public.comments
  WHERE id = NEW.comment_id;

  IF v_comment_author_id IS NOT NULL AND v_comment_author_id <> NEW.user_id THEN
    PERFORM public.internal_create_notification(
      v_comment_author_id,
      'New Like',
      'Someone liked your comment.',
      NULL
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_comment_like ON public.comment_likes;
CREATE TRIGGER trg_notify_comment_like
AFTER INSERT ON public.comment_likes
FOR EACH ROW EXECUTE FUNCTION public.trg_notify_on_comment_like();

-- 6. Trigger on blog_likes
CREATE OR REPLACE FUNCTION public.trg_notify_on_blog_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_blog_title text;
  v_blog_author_id uuid;
BEGIN
  SELECT title, author_id INTO v_blog_title, v_blog_author_id
  FROM public.blogs
  WHERE id = NEW.blog_id;

  IF v_blog_author_id IS NOT NULL AND v_blog_author_id <> NEW.user_id THEN
    PERFORM public.internal_create_notification(
      v_blog_author_id,
      'New Blog Like',
      'Someone liked your blog post "' || COALESCE(v_blog_title, 'Untitled') || '".',
      '/blogs/' || NEW.blog_id::text
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_blog_like ON public.blog_likes;
CREATE TRIGGER trg_notify_blog_like
AFTER INSERT ON public.blog_likes
FOR EACH ROW EXECUTE FUNCTION public.trg_notify_on_blog_like();

-- 7. Trigger on blog_comments
CREATE OR REPLACE FUNCTION public.trg_notify_on_blog_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_parent_author_id uuid;
  v_blog_title text;
  v_blog_author_id uuid;
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    SELECT user_id INTO v_parent_author_id
    FROM public.blog_comments
    WHERE id = NEW.parent_id;

    IF v_parent_author_id IS NOT NULL AND v_parent_author_id <> NEW.user_id THEN
      PERFORM public.internal_create_notification(
        v_parent_author_id,
        'New Reply',
        'Someone replied to your comment on a blog post.',
        '/blogs/' || NEW.blog_id::text
      );
    END IF;
  ELSE
    SELECT title, author_id INTO v_blog_title, v_blog_author_id
    FROM public.blogs
    WHERE id = NEW.blog_id;

    IF v_blog_author_id IS NOT NULL AND v_blog_author_id <> NEW.user_id THEN
      PERFORM public.internal_create_notification(
        v_blog_author_id,
        'New Comment',
        'Someone commented on your blog post "' || COALESCE(v_blog_title, 'Untitled') || '".',
        '/blogs/' || NEW.blog_id::text
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_blog_comment ON public.blog_comments;
CREATE TRIGGER trg_notify_blog_comment
AFTER INSERT ON public.blog_comments
FOR EACH ROW EXECUTE FUNCTION public.trg_notify_on_blog_comment();

-- 8. Trigger on blog_comment_likes
CREATE OR REPLACE FUNCTION public.trg_notify_on_blog_comment_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_comment_author_id uuid;
  v_blog_id uuid;
BEGIN
  SELECT user_id, blog_id INTO v_comment_author_id, v_blog_id
  FROM public.blog_comments
  WHERE id = NEW.comment_id;

  IF v_comment_author_id IS NOT NULL AND v_comment_author_id <> NEW.user_id THEN
    PERFORM public.internal_create_notification(
      v_comment_author_id,
      'New Like',
      'Someone liked your comment.',
      '/blogs/' || v_blog_id::text
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_blog_comment_like ON public.blog_comment_likes;
CREATE TRIGGER trg_notify_blog_comment_like
AFTER INSERT ON public.blog_comment_likes
FOR EACH ROW EXECUTE FUNCTION public.trg_notify_on_blog_comment_like();

-- 9. Trigger on profiles (restriction status)
CREATE OR REPLACE FUNCTION public.trg_notify_on_profile_restriction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status_text text;
BEGIN
  IF NEW.is_restricted IS DISTINCT FROM OLD.is_restricted THEN
    v_status_text := CASE WHEN NEW.is_restricted THEN 'restricted' ELSE 'unrestricted' END;

    PERFORM public.internal_create_notification(
      NEW.id,
      'Account Status Update',
      'Your account has been ' || v_status_text || ' by an administrator.',
      NULL
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_profile_restriction ON public.profiles;
CREATE TRIGGER trg_notify_profile_restriction
AFTER UPDATE OF is_restricted ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.trg_notify_on_profile_restriction();

-- Revoke direct REST access from all notification functions
REVOKE EXECUTE ON FUNCTION public.internal_create_notification(uuid, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_notify_on_follow() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_notify_on_chapter_published() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_notify_on_review() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_notify_on_comment() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_notify_on_comment_like() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_notify_on_blog_like() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_notify_on_blog_comment() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_notify_on_blog_comment_like() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_notify_on_profile_restriction() FROM PUBLIC, anon, authenticated;

-- --------------------------------------------------------------------
-- 8. storage.objects: Secure File Uploads & Ownership Isolation
-- --------------------------------------------------------------------
-- Drop unconstrained update policies on covers and avatars
DROP POLICY IF EXISTS "allow authenticated users 1cmn924_2" ON storage.objects;
DROP POLICY IF EXISTS "allow authenticated users 1oj01fe_0" ON storage.objects;
DROP POLICY IF EXISTS "allow authenticated users 1cmn924_1" ON storage.objects;
DROP POLICY IF EXISTS "allow authenticated users 1oj01fe_2" ON storage.objects;
DROP POLICY IF EXISTS "allow authenticated users 1cmn924_0" ON storage.objects;
DROP POLICY IF EXISTS "allow authenticated users 1oj01fe_1" ON storage.objects;

-- Public read for covers and avatars buckets
DROP POLICY IF EXISTS "public read covers and avatars" ON storage.objects;
CREATE POLICY "public read covers and avatars"
ON storage.objects FOR SELECT TO public
USING (bucket_id IN ('covers', 'avatars'));

-- Authenticated upload restricted to filename prefixed with user's ID
DROP POLICY IF EXISTS "users upload own covers and avatars" ON storage.objects;
CREATE POLICY "users upload own covers and avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id IN ('covers', 'avatars')
  AND starts_with(name, (SELECT auth.uid())::text || '-')
);

-- Authenticated update/delete restricted to owner's files
DROP POLICY IF EXISTS "users update own covers and avatars" ON storage.objects;
CREATE POLICY "users update own covers and avatars"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id IN ('covers', 'avatars')
  AND starts_with(name, (SELECT auth.uid())::text || '-')
)
WITH CHECK (
  bucket_id IN ('covers', 'avatars')
  AND starts_with(name, (SELECT auth.uid())::text || '-')
);

DROP POLICY IF EXISTS "users delete own covers and avatars" ON storage.objects;
CREATE POLICY "users delete own covers and avatars"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id IN ('covers', 'avatars')
  AND starts_with(name, (SELECT auth.uid())::text || '-')
);

-- Admin override on covers and avatars
DROP POLICY IF EXISTS "admins manage all covers and avatars" ON storage.objects;
CREATE POLICY "admins manage all covers and avatars"
ON storage.objects FOR ALL TO authenticated
USING (
  bucket_id IN ('covers', 'avatars')
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (SELECT auth.uid()) AND profiles.is_admin = true
  )
)
WITH CHECK (
  bucket_id IN ('covers', 'avatars')
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (SELECT auth.uid()) AND profiles.is_admin = true
  )
);

-- --------------------------------------------------------------------
-- 9. Dead Tables Baseline RLS (Resolves Linter Warnings)
-- --------------------------------------------------------------------
-- wallets: users can read their own balance; balance is not client-mutable
DROP POLICY IF EXISTS "users can view own wallet" ON public.wallets;
CREATE POLICY "users can view own wallet"
ON public.wallets FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- coin_transactions: read ledger only; inserts via backend/functions only
DROP POLICY IF EXISTS "users can view own transactions" ON public.coin_transactions;
CREATE POLICY "users can view own transactions"
ON public.coin_transactions FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- reading_time_logs:
-- Note: Client-submitted reading logs are NOT trusted for financial or authoritative metrics.
-- Authoritative reading telemetry will be decoupled via AWS SQS/Lambda in Phase 1.
DROP POLICY IF EXISTS "users can view own reading logs" ON public.reading_time_logs;
DROP POLICY IF EXISTS "users can insert own reading logs" ON public.reading_time_logs;

CREATE POLICY "users can view own reading logs"
ON public.reading_time_logs FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "users can insert own reading logs"
ON public.reading_time_logs FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

-- posts, polls, poll_votes baseline policies
DROP POLICY IF EXISTS "allow public read on posts" ON public.posts;
CREATE POLICY "allow public read on posts"
ON public.posts FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "authors can manage own posts" ON public.posts;
CREATE POLICY "authors can manage own posts"
ON public.posts FOR ALL TO authenticated
USING      ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "allow public read on polls" ON public.polls;
CREATE POLICY "allow public read on polls"
ON public.polls FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "users can view poll votes" ON public.poll_votes;
CREATE POLICY "users can view poll votes"
ON public.poll_votes FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "users can cast poll votes" ON public.poll_votes;
CREATE POLICY "users can cast poll votes"
ON public.poll_votes FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

-- --------------------------------------------------------------------
-- 10. Drop Redundant Table public.follows (Dependencies Verified)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS public.follows;
