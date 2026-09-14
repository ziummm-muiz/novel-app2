-- ====================================================================
-- Novel-App Migration: Priority One Security (Part 2)
-- File: supabase/migrations/20260914_priority_one_jwt_and_webhook.sql
-- Description:
--   1. Migrate admin authorization from profiles.is_admin subqueries to
--      JWT custom claims (auth.jwt() -> 'app_metadata' ->> 'is_admin')
--   2. Add trg_sync_profile_is_admin to propagate authorized is_admin changes
--      to auth.users.raw_app_meta_data
--   3. Decouple RLS policies on chapters, novels, profiles, and storage.objects
--   4. Add unique index on coin_transactions(reference) for database-level idempotency
--   5. Create atomic process_paystack_deposit function restricted to service_role
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. Backfill Admin Claims in auth.users.raw_app_meta_data
-- --------------------------------------------------------------------
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('is_admin', true)
WHERE id IN (SELECT id FROM public.profiles WHERE is_admin = true);

UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('is_admin', false)
WHERE id IN (SELECT id FROM public.profiles WHERE is_admin IS NOT TRUE);

-- --------------------------------------------------------------------
-- 2. Claim Synchronization Trigger on public.profiles
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_profile_is_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
    UPDATE auth.users
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('is_admin', COALESCE(NEW.is_admin, false))
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_is_admin ON public.profiles;
CREATE TRIGGER trg_sync_profile_is_admin
AFTER UPDATE OF is_admin ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_is_admin();

-- Revoke direct RPC execution on trigger function
REVOKE EXECUTE ON FUNCTION public.sync_profile_is_admin() FROM PUBLIC, anon, authenticated;

-- --------------------------------------------------------------------
-- 3. Decouple RLS Policies to JWT app_metadata Claim
-- --------------------------------------------------------------------

-- chapters: author ownership OR JWT is_admin claim
DROP POLICY IF EXISTS "authors and admins can manage chapters" ON public.chapters;
CREATE POLICY "authors and admins can manage chapters"
ON public.chapters FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.novels
    WHERE novels.id = chapters.novel_id
      AND (
        novels.author_id = (SELECT auth.uid())
        OR (COALESCE(((auth.jwt() -> 'app_metadata') ->> 'is_admin')::boolean, false) = true)
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.novels
    WHERE novels.id = chapters.novel_id
      AND (
        novels.author_id = (SELECT auth.uid())
        OR (COALESCE(((auth.jwt() -> 'app_metadata') ->> 'is_admin')::boolean, false) = true)
      )
  )
);

-- novels: JWT is_admin claim
DROP POLICY IF EXISTS "admins can manage all novels" ON public.novels;
CREATE POLICY "admins can manage all novels"
ON public.novels FOR ALL TO authenticated
USING (
  COALESCE(((auth.jwt() -> 'app_metadata') ->> 'is_admin')::boolean, false) = true
)
WITH CHECK (
  COALESCE(((auth.jwt() -> 'app_metadata') ->> 'is_admin')::boolean, false) = true
);

-- profiles: self update OR JWT is_admin claim
DROP POLICY IF EXISTS "users can update own profile" ON public.profiles;
CREATE POLICY "users can update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (
  ((SELECT auth.uid()) = id)
  OR (COALESCE(((auth.jwt() -> 'app_metadata') ->> 'is_admin')::boolean, false) = true)
)
WITH CHECK (
  ((SELECT auth.uid()) = id)
  OR (COALESCE(((auth.jwt() -> 'app_metadata') ->> 'is_admin')::boolean, false) = true)
);

-- storage.objects: JWT is_admin claim for covers and avatars buckets
DROP POLICY IF EXISTS "admins manage all covers and avatars" ON storage.objects;
CREATE POLICY "admins manage all covers and avatars"
ON storage.objects FOR ALL TO authenticated
USING (
  bucket_id IN ('covers', 'avatars')
  AND (COALESCE(((auth.jwt() -> 'app_metadata') ->> 'is_admin')::boolean, false) = true)
)
WITH CHECK (
  bucket_id IN ('covers', 'avatars')
  AND (COALESCE(((auth.jwt() -> 'app_metadata') ->> 'is_admin')::boolean, false) = true)
);

-- --------------------------------------------------------------------
-- 4. Payment Ledger Idempotency & Atomic Fulfillment Function
-- --------------------------------------------------------------------

-- Unique index to guarantee database-level idempotency
CREATE UNIQUE INDEX IF NOT EXISTS idx_coin_transactions_reference 
ON public.coin_transactions(reference) 
WHERE reference IS NOT NULL;

-- Atomic deposit function executed strictly via service_role
CREATE OR REPLACE FUNCTION public.process_paystack_deposit(
  p_user_id uuid,
  p_amount_coins integer,
  p_reference text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tx_id uuid;
  v_new_balance integer;
BEGIN
  -- 1. Input validations
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object('status', 'ERROR', 'message', 'user_id is required');
  END IF;

  IF p_amount_coins IS NULL OR p_amount_coins <= 0 THEN
    RETURN jsonb_build_object('status', 'ERROR', 'message', 'Coin amount must be greater than zero');
  END IF;

  IF p_reference IS NULL OR trim(p_reference) = '' THEN
    RETURN jsonb_build_object('status', 'ERROR', 'message', 'Transaction reference is required');
  END IF;

  -- 2. Verify target user exists in profiles
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
    RETURN jsonb_build_object('status', 'ERROR', 'message', 'Target user profile does not exist');
  END IF;

  -- 3. Idempotent check: has this reference already been processed?
  IF EXISTS (SELECT 1 FROM public.coin_transactions WHERE reference = p_reference) THEN
    SELECT coin_balance INTO v_new_balance FROM public.wallets WHERE user_id = p_user_id;
    RETURN jsonb_build_object(
      'status', 'DUPLICATE',
      'reference', p_reference,
      'coins_added', 0,
      'balance', COALESCE(v_new_balance, 0),
      'message', 'Transaction has already been processed'
    );
  END IF;

  -- 4. Atomic Ledger Insert (Protected by unique index against concurrent races)
  BEGIN
    INSERT INTO public.coin_transactions (user_id, amount, type, reference, created_at)
    VALUES (p_user_id, p_amount_coins, 'deposit', p_reference, now())
    RETURNING id INTO v_tx_id;
  EXCEPTION WHEN unique_violation THEN
    -- Concurrently inserted by duplicate delivery: handle idempotently
    SELECT coin_balance INTO v_new_balance FROM public.wallets WHERE user_id = p_user_id;
    RETURN jsonb_build_object(
      'status', 'DUPLICATE',
      'reference', p_reference,
      'coins_added', 0,
      'balance', COALESCE(v_new_balance, 0),
      'message', 'Transaction has already been processed concurrently'
    );
  END;

  -- 5. Atomic Wallet Upsert
  INSERT INTO public.wallets (user_id, coin_balance, created_at)
  VALUES (p_user_id, p_amount_coins, now())
  ON CONFLICT (user_id)
  DO UPDATE SET coin_balance = COALESCE(wallets.coin_balance, 0) + EXCLUDED.coin_balance
  RETURNING coin_balance INTO v_new_balance;

  RETURN jsonb_build_object(
    'status', 'SUCCESS',
    'transaction_id', v_tx_id,
    'reference', p_reference,
    'coins_added', p_amount_coins,
    'new_balance', v_new_balance,
    'message', 'Wallet credited successfully'
  );
END;
$$;

-- Restrict execution strictly to service_role (never callable by anon or authenticated)
REVOKE EXECUTE ON FUNCTION public.process_paystack_deposit(uuid, integer, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_paystack_deposit(uuid, integer, text) TO service_role;
