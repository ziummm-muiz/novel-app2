-- ==============================================================================
-- Migration: 20260914_priority_two_data_integrity.sql
-- Priority 2: Data Integrity, FK Covering Indexes & RLS InitPlan Optimization
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- PHASE 1: 26 Foreign Key Covering Indexes
-- Resolves all unindexed_foreign_keys findings from Supabase Performance Advisor
-- ==============================================================================

-- 1. blog_comment_likes
CREATE INDEX IF NOT EXISTS idx_blog_comment_likes_user_id 
  ON public.blog_comment_likes(user_id);

-- 2-4. blog_comments
CREATE INDEX IF NOT EXISTS idx_blog_comments_blog_id 
  ON public.blog_comments(blog_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_parent_id 
  ON public.blog_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_user_id 
  ON public.blog_comments(user_id);

-- 5. blog_likes
CREATE INDEX IF NOT EXISTS idx_blog_likes_user_id 
  ON public.blog_likes(user_id);

-- 6. blogs
CREATE INDEX IF NOT EXISTS idx_blogs_author_id 
  ON public.blogs(author_id);

-- 7. chapters
CREATE INDEX IF NOT EXISTS idx_chapters_novel_id 
  ON public.chapters(novel_id);

-- 8. coin_transactions
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_id 
  ON public.coin_transactions(user_id);

-- 9. comment_likes
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id 
  ON public.comment_likes(comment_id);

-- 10-11. comments
CREATE INDEX IF NOT EXISTS idx_comments_parent_id 
  ON public.comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id 
  ON public.comments(user_id);

-- 12. followers
CREATE INDEX IF NOT EXISTS idx_followers_following_id 
  ON public.followers(following_id);

-- 13-14. messages
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id 
  ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id 
  ON public.messages(sender_id);

-- 15. notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
  ON public.notifications(user_id);

-- 16. novels
CREATE INDEX IF NOT EXISTS idx_novels_author_id 
  ON public.novels(author_id);

-- 17. poll_votes
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_id 
  ON public.poll_votes(poll_id);

-- 18. polls
CREATE INDEX IF NOT EXISTS idx_polls_post_id 
  ON public.polls(post_id);

-- 19. posts
CREATE INDEX IF NOT EXISTS idx_posts_user_id 
  ON public.posts(user_id);

-- 20-21. reading_history
CREATE INDEX IF NOT EXISTS idx_reading_history_chapter_id 
  ON public.reading_history(chapter_id);
CREATE INDEX IF NOT EXISTS idx_reading_history_novel_id 
  ON public.reading_history(novel_id);

-- 22-23. reading_time_logs
CREATE INDEX IF NOT EXISTS idx_reading_time_logs_novel_id 
  ON public.reading_time_logs(novel_id);
CREATE INDEX IF NOT EXISTS idx_reading_time_logs_user_id 
  ON public.reading_time_logs(user_id);

-- 24-25. reviews
CREATE INDEX IF NOT EXISTS idx_reviews_novel_id 
  ON public.reviews(novel_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id 
  ON public.reviews(user_id);

-- 26. user_library
CREATE INDEX IF NOT EXISTS idx_user_library_novel_id 
  ON public.user_library(novel_id);


-- ==============================================================================
-- PHASE 2: RLS InitPlan & Permissive Policy Optimization
-- Resolves auth_rls_initplan and multiple_permissive_policies findings.
-- Preserves exact authorization semantics while wrapping auth calls in (SELECT ...).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. blogs
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authors can create blogs" ON public.blogs;
DROP POLICY IF EXISTS "Authors can update their own blogs" ON public.blogs;
DROP POLICY IF EXISTS "Authors can delete their own blogs" ON public.blogs;

CREATE POLICY "Authors can create blogs" ON public.blogs 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT auth.uid()) = author_id);

CREATE POLICY "Authors can update their own blogs" ON public.blogs 
  FOR UPDATE TO authenticated 
  USING ((SELECT auth.uid()) = author_id) 
  WITH CHECK ((SELECT auth.uid()) = author_id);

CREATE POLICY "Authors can delete their own blogs" ON public.blogs 
  FOR DELETE TO authenticated 
  USING ((SELECT auth.uid()) = author_id);

-- ------------------------------------------------------------------------------
-- 2. blog_likes
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can toggle their own likes" ON public.blog_likes;

CREATE POLICY "Users can insert own blog likes" ON public.blog_likes 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own blog likes" ON public.blog_likes 
  FOR DELETE TO authenticated 
  USING ((SELECT auth.uid()) = user_id);

-- ------------------------------------------------------------------------------
-- 3. blog_comments
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can post comments" ON public.blog_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.blog_comments;

CREATE POLICY "Users can post comments" ON public.blog_comments 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own comments" ON public.blog_comments 
  FOR DELETE TO authenticated 
  USING ((SELECT auth.uid()) = user_id);

-- ------------------------------------------------------------------------------
-- 4. blog_comment_likes
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can toggle their own comment likes" ON public.blog_comment_likes;

CREATE POLICY "Users can insert own comment likes" ON public.blog_comment_likes 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own comment likes" ON public.blog_comment_likes 
  FOR DELETE TO authenticated 
  USING ((SELECT auth.uid()) = user_id);

-- ------------------------------------------------------------------------------
-- 5. messages
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can read their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Receivers can update messages" ON public.messages;

CREATE POLICY "Users can read their own messages" ON public.messages 
  FOR SELECT TO authenticated 
  USING (((SELECT auth.uid()) = sender_id) OR ((SELECT auth.uid()) = receiver_id));

CREATE POLICY "Users can insert messages" ON public.messages 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT auth.uid()) = sender_id);

CREATE POLICY "Receivers can update messages" ON public.messages 
  FOR UPDATE TO authenticated 
  USING ((SELECT auth.uid()) = receiver_id) 
  WITH CHECK ((SELECT auth.uid()) = receiver_id);

-- ------------------------------------------------------------------------------
-- 6. chapters
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "authors and admins can manage chapters" ON public.chapters;

CREATE POLICY "authors and admins can insert chapters" ON public.chapters 
  FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.novels 
    WHERE novels.id = chapters.novel_id 
      AND (novels.author_id = (SELECT auth.uid()) 
           OR COALESCE((((SELECT auth.jwt()) -> 'app_metadata'::text) ->> 'is_admin'::text)::boolean, false) = true)
  ));

CREATE POLICY "authors and admins can update chapters" ON public.chapters 
  FOR UPDATE TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM public.novels 
    WHERE novels.id = chapters.novel_id 
      AND (novels.author_id = (SELECT auth.uid()) 
           OR COALESCE((((SELECT auth.jwt()) -> 'app_metadata'::text) ->> 'is_admin'::text)::boolean, false) = true)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.novels 
    WHERE novels.id = chapters.novel_id 
      AND (novels.author_id = (SELECT auth.uid()) 
           OR COALESCE((((SELECT auth.jwt()) -> 'app_metadata'::text) ->> 'is_admin'::text)::boolean, false) = true)
  ));

CREATE POLICY "authors and admins can delete chapters" ON public.chapters 
  FOR DELETE TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM public.novels 
    WHERE novels.id = chapters.novel_id 
      AND (novels.author_id = (SELECT auth.uid()) 
           OR COALESCE((((SELECT auth.jwt()) -> 'app_metadata'::text) ->> 'is_admin'::text)::boolean, false) = true)
  ));

-- ------------------------------------------------------------------------------
-- 7. novels
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "admins can manage all novels" ON public.novels;
DROP POLICY IF EXISTS "authors can manage own novels" ON public.novels;

CREATE POLICY "authors and admins can insert novels" ON public.novels 
  FOR INSERT TO authenticated 
  WITH CHECK (
    ((SELECT auth.uid()) = author_id) 
    OR COALESCE((((SELECT auth.jwt()) -> 'app_metadata'::text) ->> 'is_admin'::text)::boolean, false) = true
  );

CREATE POLICY "authors and admins can update novels" ON public.novels 
  FOR UPDATE TO authenticated 
  USING (
    ((SELECT auth.uid()) = author_id) 
    OR COALESCE((((SELECT auth.jwt()) -> 'app_metadata'::text) ->> 'is_admin'::text)::boolean, false) = true
  )
  WITH CHECK (
    ((SELECT auth.uid()) = author_id) 
    OR COALESCE((((SELECT auth.jwt()) -> 'app_metadata'::text) ->> 'is_admin'::text)::boolean, false) = true
  );

CREATE POLICY "authors and admins can delete novels" ON public.novels 
  FOR DELETE TO authenticated 
  USING (
    ((SELECT auth.uid()) = author_id) 
    OR COALESCE((((SELECT auth.jwt()) -> 'app_metadata'::text) ->> 'is_admin'::text)::boolean, false) = true
  );

-- ------------------------------------------------------------------------------
-- 8. comment_likes
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "authenticated users can manage own comment likes" ON public.comment_likes;

CREATE POLICY "authenticated users can insert own comment likes" ON public.comment_likes 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "authenticated users can delete own comment likes" ON public.comment_likes 
  FOR DELETE TO authenticated 
  USING ((SELECT auth.uid()) = user_id);

-- ------------------------------------------------------------------------------
-- 9. comments
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "authenticated users can manage own comments" ON public.comments;

CREATE POLICY "authenticated users can insert own comments" ON public.comments 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "authenticated users can update own comments" ON public.comments 
  FOR UPDATE TO authenticated 
  USING ((SELECT auth.uid()) = user_id) 
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "authenticated users can delete own comments" ON public.comments 
  FOR DELETE TO authenticated 
  USING ((SELECT auth.uid()) = user_id);

-- ------------------------------------------------------------------------------
-- 10. followers
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "users can manage own follows" ON public.followers;

CREATE POLICY "users can insert own follows" ON public.followers 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT auth.uid()) = follower_id);

CREATE POLICY "users can delete own follows" ON public.followers 
  FOR DELETE TO authenticated 
  USING ((SELECT auth.uid()) = follower_id);

-- ------------------------------------------------------------------------------
-- 11. posts
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "authors can manage own posts" ON public.posts;

CREATE POLICY "authors can insert own posts" ON public.posts 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "authors can update own posts" ON public.posts 
  FOR UPDATE TO authenticated 
  USING ((SELECT auth.uid()) = user_id) 
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "authors can delete own posts" ON public.posts 
  FOR DELETE TO authenticated 
  USING ((SELECT auth.uid()) = user_id);

-- ------------------------------------------------------------------------------
-- 12. reviews
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "authenticated users can manage own reviews" ON public.reviews;

CREATE POLICY "authenticated users can insert own reviews" ON public.reviews 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "authenticated users can update own reviews" ON public.reviews 
  FOR UPDATE TO authenticated 
  USING ((SELECT auth.uid()) = user_id) 
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "authenticated users can delete own reviews" ON public.reviews 
  FOR DELETE TO authenticated 
  USING ((SELECT auth.uid()) = user_id);

-- ------------------------------------------------------------------------------
-- 13. profiles
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "users can update own profile" ON public.profiles;

CREATE POLICY "users can update own profile" ON public.profiles 
  FOR UPDATE TO authenticated 
  USING (
    ((SELECT auth.uid()) = id) 
    OR COALESCE((((SELECT auth.jwt()) -> 'app_metadata'::text) ->> 'is_admin'::text)::boolean, false) = true
  )
  WITH CHECK (
    ((SELECT auth.uid()) = id) 
    OR COALESCE((((SELECT auth.jwt()) -> 'app_metadata'::text) ->> 'is_admin'::text)::boolean, false) = true
  );


-- ==============================================================================
-- PHASE 3: Database Integrity Constraints & Nullability Hardening
-- ==============================================================================

-- 1. Reviews: user_id & novel_id NOT NULL + UNIQUE (user_id, novel_id)
ALTER TABLE public.reviews ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.reviews ALTER COLUMN novel_id SET NOT NULL;
ALTER TABLE public.reviews 
  DROP CONSTRAINT IF EXISTS reviews_user_id_novel_id_key;
ALTER TABLE public.reviews 
  ADD CONSTRAINT reviews_user_id_novel_id_key UNIQUE (user_id, novel_id);

-- 2. Chapters: novel_id NOT NULL + UNIQUE (novel_id, chapter_number)
ALTER TABLE public.chapters ALTER COLUMN novel_id SET NOT NULL;
ALTER TABLE public.chapters 
  DROP CONSTRAINT IF EXISTS chapters_novel_id_chapter_number_key;
ALTER TABLE public.chapters 
  ADD CONSTRAINT chapters_novel_id_chapter_number_key UNIQUE (novel_id, chapter_number);

-- 3. Wallets: user_id NOT NULL, coin_balance NOT NULL DEFAULT 0, CHECK coin_balance >= 0
ALTER TABLE public.wallets ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.wallets ALTER COLUMN coin_balance SET DEFAULT 0;
ALTER TABLE public.wallets ALTER COLUMN coin_balance SET NOT NULL;
ALTER TABLE public.wallets 
  DROP CONSTRAINT IF EXISTS wallets_coin_balance_non_negative;
ALTER TABLE public.wallets 
  ADD CONSTRAINT wallets_coin_balance_non_negative CHECK (coin_balance >= 0);

-- 4. Coin Transactions: Non-zero amount, deposits strictly positive (> 0)
ALTER TABLE public.coin_transactions 
  DROP CONSTRAINT IF EXISTS coin_transactions_amount_nonzero;
ALTER TABLE public.coin_transactions 
  ADD CONSTRAINT coin_transactions_amount_nonzero CHECK (amount <> 0);

ALTER TABLE public.coin_transactions 
  DROP CONSTRAINT IF EXISTS coin_transactions_deposit_positive;
ALTER TABLE public.coin_transactions 
  ADD CONSTRAINT coin_transactions_deposit_positive CHECK (type != 'deposit' OR amount > 0);

COMMIT;
