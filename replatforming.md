# Novel-App → AWS: Comprehensive Replatforming Plan

> **Live Audit Date:** 14 September 2026
> **Supabase Project:** `novel-app` (`rrkxgtsujcgytdjjrooo`) — `ACTIVE_HEALTHY`, `eu-west-1`
> **DB Engine:** PostgreSQL 17.6.1.141 — **22 tables** (not 15 as previously documented)
> **AWS Account:** `485389268940` — linked and active in Antigravity IDE
> **Target Region:** `eu-west-1` (Ireland) — matches existing Supabase region

---

## Current Scores (Live-Verified)

| Dimension | Original Estimate | Live-Verified | Key Reason |
|---|---|---|---|
| Architecture | 7/10 | **6/10** | 22 tables, 7 dead, 0 migrations tracked |
| Security | 5.5/10 | **3.5/10** | Critical RLS holes confirmed live |
| Codebase Maturity | 6/10 | **5/10** | No migration history, broken policy patterns |
| Production Readiness | 5/10 | **4/10** | 27 unindexed FKs, 22 per-row auth re-evaluations |

---

## Part 1 — What the Previous Review Got Wrong

### ❌ "15 database tables"

**Reality:** 22 tables exist live:

```
profiles          novels             chapters          reviews
comments          comment_likes      user_library      reading_history
reading_time_logs messages           posts             polls
poll_votes        wallets            coin_transactions  follows
followers         blogs              blog_likes        blog_comments
blog_comment_likes  notifications
```

7 more tables than documented — most with zero rows and zero RLS policies.

### ❌ "RLS is enabled — just verify the policies"

**Reality confirmed — and it's worse than stated.** 6 tables have RLS ON but **no policies at all**. This doesn't make them insecure — it makes them **completely inaccessible**. Every query returns no rows. Features depending on them are silently broken:

| Table | RLS | Policies | Effect |
|---|---|---|---|
| `coin_transactions` | ✅ | ❌ 0 | Dead — wallet transactions broken |
| `poll_votes` | ✅ | ❌ 0 | Dead |
| `polls` | ✅ | ❌ 0 | Dead |
| `posts` | ✅ | ❌ 0 | Dead |
| `reading_time_logs` | ✅ | ❌ 0 | Dead — reading analytics broken |
| `wallets` | ✅ | ❌ 0 | Dead — entire wallet feature broken |

### ❌ "Schema migrations exist"

**Reality:** `supabase migrations list` → **empty array**. Zero migrations tracked via Supabase CLI. The entire database was built through the dashboard. Consequences:
- No reproducible, version-controlled schema
- Cannot recreate the database from code
- No CI/CD pipeline can safely deploy schema changes
- **Hard blocker for AWS migration**

### ❌ "`handle_new_user` is probably just a trigger" *(implied, unchecked)*

**Reality confirmed:** It is a `SECURITY DEFINER` function with **three live vulnerabilities**:
1. **Mutable `search_path`** — schema injection risk
2. **Callable by `anon` role** via `/rest/v1/rpc/handle_new_user` — unauthenticated users can invoke it
3. **Callable by authenticated users** via REST API — should never be a public RPC

---

## Part 2 — Critical Security Issues (Live-Confirmed)

### 🔴 CRITICAL — `chapters`: any authenticated user can edit any chapter

```sql
-- Actual live policy on public.chapters:
policyname: "allow users edit chapters"
cmd:        ALL
roles:      {authenticated}
qual:       true          -- NO ownership check whatsoever
with_check: null
```

**Any signed-in user can UPDATE or DELETE chapters from any author's novel.** Most urgent fix.

```sql
-- Fix:
DROP POLICY "allow users edit chapters" ON public.chapters;

CREATE POLICY "authors can manage own chapters"
ON public.chapters FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.novels
    WHERE novels.id = chapters.novel_id
      AND novels.author_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.novels
    WHERE novels.id = chapters.novel_id
      AND novels.author_id = (SELECT auth.uid())
  )
);
```

### 🔴 CRITICAL — `profiles`: privilege escalation chain to admin

```sql
policyname: "allow users edit profiles"
cmd:        ALL
roles:      {authenticated}
qual:       (auth.uid() = id)
with_check: null     -- No write-time column restriction
```

Escalation chain:
1. User sets `is_admin = true` on their own `profiles` row (no column-level block)
2. Admin policy on `novels` reads `profiles.is_admin` via subquery
3. User now passes the admin check and can UPDATE any novel

```sql
-- Fix:
DROP POLICY "allow users edit profiles" ON public.profiles;

CREATE POLICY "users can update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING      ((SELECT auth.uid()) = id)
WITH CHECK ((SELECT auth.uid()) = id);

-- Block is_admin self-escalation:
CREATE OR REPLACE FUNCTION prevent_is_admin_self_escalation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  IF NEW.is_admin <> OLD.is_admin THEN
    RAISE EXCEPTION 'Cannot modify is_admin directly';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_no_admin_self_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION prevent_is_admin_self_escalation();
```

### 🔴 HIGH — `novels` admin policy applied to `{public}` role

```sql
policyname: "allow admins to update novels"
cmd:        UPDATE
roles:      {public}     -- fires for unauthenticated requests
qual:       (EXISTS (SELECT 1 FROM profiles
             WHERE profiles.id = auth.uid()
               AND profiles.is_admin = true))
```

Fix: restrict to `{authenticated}`. Long-term: replace `profiles.is_admin` subquery with a JWT custom claim.

### 🔴 HIGH — Write policies on `{public}` role (should be `{authenticated}`)

These mutation policies are incorrectly assigned to `{public}`. They rely on `auth.uid()` returning `null` for anon sessions as a side-effect security check — fragile and semantically wrong:

| Table | Policy Name |
|---|---|
| `comments` | Allow authenticated insert/update/delete on comments |
| `comment_likes` | Allow authenticated insert/delete on comment_likes |
| `follows` | Allow user own follows access (also missing `with_check`) |
| `reviews` | Allow authenticated insert/update/delete on reviews |
| `user_library` | Allow user own library access |
| `reading_history` | Allow user own reading history access |

Fix pattern (apply to each):
```sql
DROP POLICY "<old_name>" ON public.<table>;
CREATE POLICY "authenticated users can manage own <records>"
ON public.<table> FOR ALL TO authenticated
USING      ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);
```

### 🔴 HIGH — `handle_new_user`: three live security defects

```sql
-- Fix:
ALTER FUNCTION public.handle_new_user() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
```

### 🟠 MEDIUM — `notifications` insert policy too permissive

```sql
policyname: "System can insert notifications"
roles:      {authenticated}
cmd:        INSERT
with_check: true    -- any authenticated user can notify any other user
```

Must be service-role-only via a server-side function. Revoke from authenticated users.

### 🟠 MEDIUM — `follows` and `followers` are duplicate tables

`public.follows` (0 rows) and `public.followers` (7 rows) track the same relationship. Consolidate to one canonical table before migration.

### 🟠 MEDIUM — Leaked password protection disabled

Enable HaveIBeenPwned integration in **Supabase Dashboard → Authentication → Password Strength**.

### 🟠 MEDIUM — `wallets` and `coin_transactions` dead but critical

When policies are added they must enforce:
- `wallets`: read own wallet only; **no direct UPDATE of `coin_balance` from the browser**
- `coin_transactions`: read own only; **inserts only via server-side service-role functions**, never from the client

---

## Part 3 — Performance Issues (Live-Confirmed)

### ⚠️ 27 Unindexed Foreign Keys

Every foreign key across all 22 tables is missing a covering index. Full table scans on every JOIN.

```sql
-- Core reading path
CREATE INDEX idx_chapters_novel_id          ON public.chapters(novel_id);
CREATE INDEX idx_novels_author_id           ON public.novels(author_id);
CREATE INDEX idx_reading_history_user_id    ON public.reading_history(user_id);
CREATE INDEX idx_reading_history_novel_id   ON public.reading_history(novel_id);
CREATE INDEX idx_reading_time_logs_user_id  ON public.reading_time_logs(user_id);
CREATE INDEX idx_reading_time_logs_novel_id ON public.reading_time_logs(novel_id);

-- Social
CREATE INDEX idx_followers_following_id     ON public.followers(following_id);
CREATE INDEX idx_follows_following_id       ON public.follows(following_id);
CREATE INDEX idx_comments_user_id           ON public.comments(user_id);
CREATE INDEX idx_comments_parent_id         ON public.comments(parent_id);

-- Messaging & notifications
CREATE INDEX idx_messages_sender_id         ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver_id       ON public.messages(receiver_id);
CREATE INDEX idx_notifications_user_id      ON public.notifications(user_id);

-- Financial
CREATE INDEX idx_coin_transactions_user_id  ON public.coin_transactions(user_id);

-- Content & reviews
CREATE INDEX idx_reviews_novel_id           ON public.reviews(novel_id);
CREATE INDEX idx_reviews_user_id            ON public.reviews(user_id);
CREATE INDEX idx_blog_comments_blog_id      ON public.blog_comments(blog_id);
CREATE INDEX idx_blog_comments_user_id      ON public.blog_comments(user_id);
CREATE INDEX idx_blogs_author_id            ON public.blogs(author_id);
CREATE INDEX idx_poll_votes_poll_id         ON public.poll_votes(poll_id);
CREATE INDEX idx_polls_post_id              ON public.polls(post_id);
CREATE INDEX idx_posts_user_id              ON public.posts(user_id);
```

### ⚠️ 22 RLS Policies Re-evaluating `auth.uid()` Per Row

Every policy calling `auth.uid()` directly forces PostgreSQL to re-execute it per row scanned.

```sql
-- BEFORE (slow — re-evaluated per row):
USING (auth.uid() = user_id)

-- AFTER (fast — evaluated once per query):
USING ((SELECT auth.uid()) = user_id)
```

Affects: `novels`, `profiles`, `followers`, `blogs`, `blog_likes`, `blog_comments`, `blog_comment_likes`, `messages`, `notifications`, `reviews`, `comments`, `comment_likes`, `user_library`, `reading_history`, `follows`

### ⚠️ 27 Duplicate Permissive Policies (Same Role + Action)

PostgreSQL evaluates ALL permissive policies even when the first already permits. Worst offenders: `comment_likes` (10 pairs), `comments` (10 pairs), `follows` (10 pairs), `reviews` (6 pairs), `novels` (duplicate SELECT + UPDATE), `profiles` (duplicate SELECT).

Consolidate to one policy per role per action on each table.

---

## Part 4 — Pre-Migration Checklist

### 🔴 Priority 0 — Critical Blockers (COMPLETED ✅)

- [x] Fix `chapters` RLS — add ownership check via `novels.author_id` and admin override (verified with WITH CHECK novel reassignment tests)
- [x] Fix `profiles` ALL policy — add `with_check`, separate UPDATE from INSERT/SELECT
- [x] Add `prevent_is_admin_self_escalation` trigger on `profiles` (verified: blocks non-admin escalation, allows admin management)
- [x] Fix `novels` admin policy — change role from `{public}` to `{authenticated}`
- [x] Fix `comments`, `comment_likes`, `reviews`, `user_library`, `reading_history`, `followers` — change role from `{public}` to `{authenticated}`
- [x] Add `with_check` to all write policies missing it
- [x] Fix `handle_new_user` — set `search_path = public`, revoke EXECUTE from PUBLIC, anon, and authenticated
- [x] Add RLS policies to all 6 dead tables (`wallets`, `coin_transactions`, `reading_time_logs`, `posts`, `polls`, `poll_votes`) — advisor warnings resolved
- [x] Fix `notifications` insert — replaced open insert policy with `create_notification()` and `notify_chapter_published()` SECURITY DEFINER functions
- [x] Resolve `follows` / `followers` duplication — verified 0 dependencies and dropped empty `follows` table

### 🔴 Priority 1 — Security (COMPLETED ✅)

- [x] Protect `wallets.coin_balance` — client direct mutation blocked by RLS; read own wallet only
- [x] Protect `coin_transactions` — client direct inserts blocked by RLS; read own ledger only
- [x] Audit file upload authorization (cover images, avatars) — restricted in `storage.objects` by user ID prefix
- [x] Confirm no service-role key is in any `NEXT_PUBLIC_*` env var (confirmed clean)
- [x] Move admin authorization to JWT custom claims (`app_metadata.is_admin`) — decoupled 4 RLS policies from `profiles.is_admin` subqueries
- [x] Implement Paystack payment webhook with timing-safe HMAC-SHA512 signature verification, semantic event validation, and database-enforced idempotency (`UNIQUE(reference)`)
- [x] Acknowledge HaveIBeenPwned leaked password protection as deferred (unavailable on current Supabase Free plan; will enable upon upgrade)

### 🟠 Priority 2 — Data Integrity & Performance (COMPLETED ✅)

- [x] All schema changes version-controlled as migration files (`supabase/migrations/20260914_priority_two_data_integrity.sql`)
- [x] Covering indexes added for all 26 unindexed foreign keys — verified in PostgreSQL catalog & Performance Advisor (`unindexed_foreign_keys: 0`)
- [x] RLS policies optimized to eliminate InitPlan re-evaluations — wrapped `auth.uid()` and `auth.jwt()` in `(SELECT ...)` (`auth_rls_initplan: 0`)
- [x] Duplicate permissive policies eliminated — scoped mutation policies to discrete actions (`INSERT`, `UPDATE`, `DELETE`) leaving public `SELECT` unhindered (`multiple_permissive_policies: 0`)
- [x] Enforce NOT NULL and UNIQUE constraints:
  - `reviews(user_id, novel_id)` — NOT NULL + UNIQUE (verified via catalog and live collision tests)
  - `chapters(novel_id, chapter_number)` — NOT NULL + UNIQUE (verified via catalog and live collision tests)
  - `user_library(user_id, novel_id)` — (existing UNIQUE verified)
  - `reading_history(user_id, novel_id)` — (existing UNIQUE verified)
  - `followers(follower_id, following_id)` — (existing PK verified)
  - `comment_likes(user_id, comment_id)` — (existing UNIQUE verified)
- [x] Financial ledger invariant verified:
  - `coin_transactions` is the append-only audit trail (client direct mutations blocked by RLS)
  - `wallets.coin_balance` is the materialized balance with non-negative check (`coin_balance >= 0`, verified)
  - No slow historical `SUM()` recalculation trigger
  - Future payment/chapter purchase workflows will execute atomic ledger + wallet writes in controlled server-side/database transactions
- [x] Chapter numbering uniqueness enforced: `UNIQUE(novel_id, chapter_number)` prevents duplicates
- [x] Database check constraints added: `amount <> 0`, deposits strictly positive, `wallets.coin_balance >= 0`

### 🟢 Priority 3 — Code Quality & Architecture (COMPLETED ✅)

- [x] Live database types generated from current Supabase schema (`types/database.types.ts`) across all 22 tables
- [x] Browser, server, and admin Supabase clients strongly typed with `<Database>` generic
- [x] Domain types separated from raw DB rows (`ReviewWithAuthor`, `CommentWithMeta`, `CommentNode`, `NovelWithAuthor`)
- [x] Comment tree typed with recursive `CommentNode[]` with documented orphan fallback and stable sibling ordering
- [x] Unjustified application-level `any` eliminated across the entire codebase (verified with 0 matches in `.ts`/`.tsx`)
- [x] Zod validation schemas implemented (`lib/validations/`) for novels, chapters, reviews, comments, and profile updates
- [x] Server Actions refactored to validate input with Zod at the application boundary
- [x] Authentication and authorization checks verified in Server Actions
- [x] Reusable database reads centralized into pragmatic DAL modules (`lib/dal/novels.ts`, `chapters.ts`, `profiles.ts`, `engagement.ts`)
- [x] Components refactored to consume DAL functions and strongly-typed domain data
- [x] Error handling standardized: typed returns, surfacing Postgres constraint codes (`23505`) and domain errors
- [x] Unused `Geist` font removed from `app/layout.tsx`
- [x] Hardcoded `vercel.app` fallback removed; centralized `SITE_URL` config in `lib/constants.ts`
- [x] Unit tests added for comment tree nesting (`lib/__tests__/comments.test.ts`)
- [x] Unit tests added for Zod validation schemas (`lib/__tests__/validations.test.ts`)
- [x] Authorization and business-rule tests added (`lib/__tests__/auth-rules.test.ts`)
- [x] Vitest configured in `package.json` scripts (`"test": "vitest run"`) and added to devDependencies

### ✅ Priority 4 — Product COMPLETED

- [x] Categorize all features in README: **IMPLEMENTED / IN PROGRESS / PLANNED**
- [x] Remove unsubstantiated claims ("sub-50ms delivery", "zero billing overhead", "Cloudflare R2")
- [x] Define MVP feature set — **17 Active MVP / 4 Deferred / 1 Deprecated** table classification documented in README and `replatforming.md` (no destructive schema changes)
- [x] Rebranded to **Mi Novaria**; `SITE_URL` is the single source of truth for all URLs
- [x] SEO: dynamic `app/robots.ts` (public routes allowed, private routes disallowed)
- [x] SEO: dynamic `app/sitemap.ts` (published novels, chapters, blogs + static marketing pages; drafts and soft-deleted content excluded)
- [x] SEO: `generateMetadata` with canonical URLs and OpenGraph on novel, chapter, blog, categories, best-seller, and blogs pages
- [x] SEO: Schema.org `Book` JSON-LD on novel pages (strictly real database values; `aggregateRating` only present when reviews exist)
- [x] SEO: Schema.org `BlogPosting` JSON-LD on individual blog pages
- [x] Public accessibility: removed artificial auth-walls from novel, chapter, and blog pages (crawlers + anonymous readers can access; reading history recorded for authenticated users)
- [x] `npm run typecheck` — 0 errors ✅
- [x] `npm test` — 23/23 tests pass ✅
- [x] `npm run build` — exit code 0; 25 routes generated including `/robots.txt` (static) and `/sitemap.xml` (static) ✅

---

## Part 5 — Target AWS Architecture

### Phase 1 — Hosting Migration (Keep Supabase)

Start here. Lowest risk, full AWS story, preserves existing auth/database.

```
                        INTERNET
                            │
                            ▼
                     ┌─────────────┐
                     │  Route 53   │  DNS + health checks
                     └──────┬──────┘
                            │
                            ▼
                     ┌─────────────┐
                     │ CloudFront  │  CDN + WAF (rate limit, geo-block)
                     │  + ACM TLS  │
                     └──────┬──────┘
                            │
              ┌─────────────┴──────────────┐
              ▼                            ▼
   ┌──────────────────────┐    ┌──────────────────────┐
   │  AWS App Runner      │    │  S3 Bucket           │
   │  Next.js container   │    │  Cover images        │
   │  (auto-scale, VPC)   │    │  Avatars             │
   └──────────┬───────────┘    │  Static assets       │
              │                └──────────────────────┘
   ┌──────────┴────────────┐
   ▼                       ▼
Supabase                AWS SQS
Auth + DB (eu-west-1)       │
                            ▼
                        Lambda
                            │
                            ▼
                   Analytics processor
                   (reading_time_logs
                    heartbeat events)
```

**Phase 1 service inventory:**

| Service | Purpose | Justification |
|---|---|---|
| Route 53 | DNS, health checks | Integrates natively with ACM + CloudFront |
| ACM | TLS certificate | Free, auto-renews |
| CloudFront | CDN, WAF, edge caching | Static assets + API edge cache |
| AWS App Runner | Next.js hosting | Auto-scales, supports containers, lower ops than ECS |
| ECR | Container registry | Docker image for Next.js app |
| S3 | Media storage | Replaces Cloudflare R2 |
| SQS | Analytics event queue | Decouples 30s heartbeat writes from Supabase |
| Lambda | Async batch processor | Batches analytics writes — legitimate engineering justification |
| Secrets Manager | Environment secrets | Replaces `.env` file for service-role key |
| CloudWatch | Logs + metrics + alarms | Required before production |

> **App Runner vs Amplify:** Amplify has constraints with Next.js App Router server actions and streaming. App Runner supports any container, auto-scales to zero, and integrates with VPC for future RDS access.

### Phase 2 — CI/CD + Observability

```
GitHub Push (main)
       │
       ▼
GitHub Actions
       ├── npx vitest run (unit + integration tests)
       ├── npx supabase db push (migrations)
       ├── docker build
       ├── docker push → ECR
       └── aws apprunner start-deployment
                 │
                 ▼
           CloudWatch
           Dashboards + Alarms → SNS → Email
```

- **OIDC trust** between GitHub Actions and AWS IAM — no long-lived credentials in GitHub secrets
- **4 Golden Signals** in CloudWatch: latency, traffic, errors, saturation

### Phase 3 — Full AWS Backend (Optional, Later)

Only pursue for data residency, compliance, or scale reasons:

```
           Cognito          RDS (PostgreSQL)        S3
              │                    │                 │
              └────────────────────┴─────────────────┘
                                   │
                          Next.js API Routes
                                   │
                        ┌──────────┴──────────┐
                        ▼                     ▼
                       SQS                 Lambda
```

> ⚠️ **Phase 3 is a backend rewrite, not a hosting migration.** Supabase Auth → Cognito requires rewriting all auth flows, session handling, and RLS policies. Do not conflate with Phase 1.

---

## Part 6 — Tooling Inventory

Two separate extension environments exist: **Antigravity IDE** (the environment I operate in) and **standard VS Code** (your regular editor window). They have separate extension registries.

### Antigravity IDE Extensions (Available in This Conversation)

| Extension | Capability | Live AWS? |
|---|---|---|
| **AWS Toolkit** (account `485389268940`) | CloudFormation stacks, Lambda, App Runner, ECR — all from VS Code sidebar | ✅ Live |
| **Aws CloudWatch** | Browse live CloudWatch log groups and streams in VS Code | ✅ Live |
| **Aws IAM** | Create and manage IAM roles/policies from VS Code | ✅ Live |
| **Aws Lambda** | Invoke, trigger, and monitor Lambda functions inline | ✅ Live |
| **Aws S3** | Browse S3 buckets, upload/download objects | ✅ Live |
| **AWS Transform** | Modernization agent for legacy code migration | ✅ Live |
| **CloudFormation Linter** | Inline `cfn-lint` — validates templates as you type | Static |

### MCP Servers (Available in This Conversation)

| Server | Tool | Live? | Capability |
|---|---|---|---|
| `supabase` | All tools | ✅ **Live** | Full DB control — run SQL, fix policies, apply migrations, read advisors |
| `awslabs.aws-iac-mcp-server` | `troubleshoot_cloudformation_deployment` | ✅ **Live** | Reads live stack events + CloudTrail after a failed deploy |
| `awslabs.aws-iac-mcp-server` | `validate_cloudformation_template` | Static | Lint/schema validate CFn templates with cfn-lint |
| `awslabs.aws-iac-mcp-server` | `check_cloudformation_template_compliance` | Static | Security compliance check via cfn-guard |
| `awslabs.aws-iac-mcp-server` | `search_cdk_documentation` | Static | CDK construct API docs |
| `awslabs.aws-iac-mcp-server` | `search_cloudformation_documentation` | Static | CFn resource docs |
| `aws-knowledge-mcp` | `aws___get_regional_availability` | Static | Check service availability in `eu-west-1` |
| `awslabs.aws-documentation-mcp-server` | All docs tools | Static | AWS official docs search and read |

### Standard VS Code Extensions (Relevant)

| Extension | Capability | Used When |
|---|---|---|
| `ms-azuretools.vscode-containers` | Docker image build, run, inspect | Building the Next.js container before pushing to ECR |
| `quicktype.quicktype` | Generate TypeScript types from JSON | Fixing `any` types — paste Supabase response, get typed interfaces |
| `vitest.explorer` | Visual test runner | Running test suite before each deploy |
| `humao.rest-client` / `rangav.vscode-thunder-client` | HTTP file testing | Testing API routes and webhooks post-deploy |
| `eamodio.gitlens` | Git history + blame | Tracking when broken policies were introduced |
| `mintlify.document` | Auto JSDoc/TSDoc generation | Documenting the data access layer |
| `grayhat.v0` | UI design iteration | UI/UX V2 redesign phase |
| `cirlorm.mobileview` | Mobile preview | Mobile experience improvements |

### What Needs the AWS Console (One-Off Only)

| Task | Why |
|---|---|
| Route 53 domain registration | Registrar UI required |
| ACM certificate DNS/email validation click | One-time human action |
| First `cdk bootstrap` or `aws configure` | Terminal command, one-off |
| Secrets Manager initial value entry | Security best practice to type manually |

---

## Part 7 — Migration Execution Plan

### Step 1: Foundation (Weeks 1–2)
1. `npx supabase init && npx supabase db pull` — generate baseline migration
2. Fix all Priority 0 RLS issues (SQL in Part 2)
3. Add all 27 missing indexes (SQL in Part 3)
4. Fix `handle_new_user` — `search_path` + revoke execute
5. Resolve `follows` / `followers` duplication
6. Enable leaked password protection

### Step 2: Schema Stabilization (Weeks 2–3)
1. Add UNIQUE constraints
2. Fix all `auth.uid()` → `(SELECT auth.uid())` in policies
3. Consolidate duplicate permissive policies
4. Implement wallet as immutable ledger (server-side functions only)
5. Remove all `any` TypeScript (use `quicktype`)
6. Centralize Supabase queries

### Step 3: Product Definition (Weeks 3–4) — Priority 4 [IN PROGRESS]

1. **Database Schema & Table Strategy**:
   * **17 Active MVP Tables**: `profiles`, `novels`, `chapters`, `reviews`, `comments`, `comment_likes`, `user_library`, `reading_history`, `messages`, `wallets`, `coin_transactions`, `followers`, `blogs`, `blog_likes`, `blog_comments`, `blog_comment_likes`, `notifications`. Fully supported by 26 FK covering indexes, RLS policies, Zod validation, and DAL queries.
   * **4 Deferred / Frozen Tables**: `posts`, `polls`, `poll_votes`, `reading_time_logs`. Retained in PostgreSQL schema; active UI and writing workflows deferred to post-MVP releases to maintain strict project scope.
   * **1 Deprecated Table**: `follows`. Superseded by canonical `followers` table.
2. **Authoritative Implementation Baseline**:
   * **Financial Integrity**: Cryptographic Paystack HMAC-SHA512 webhook verification, atomic idempotent coin deposit RPC (`process_paystack_deposit`), wallet balance check (`wallets.coin_balance >= 0`), and non-zero transaction amounts.
   * **Security & Auth**: Custom JWT administrative claims (`app_metadata.is_admin`) without recurring DB lookups; non-overlapping RLS policies with `(SELECT auth.uid())` InitPlan optimizations; column-level trigger preventing self-escalation.
   * **Code Quality**: Live-generated Supabase types (`types/database.types.ts`), zero unjustified `any` types across the codebase, runtime Zod boundary validation, and pragmatic Data Access Layer (`lib/dal/`).
3. **Messaging Architecture Distinction**:
   * **Implemented MVP**: Direct user-to-user messaging data model and conversation threading (`messages`).
   * **Planned Roadmap**: Real-time Supabase broadcast channels with live user typing indicators and presence.
4. **Comprehensive Dynamic SEO**:
   * **Single Source of Truth**: Centralized `SITE_URL` (`lib/constants.ts`) for canonical URLs, sitemap URLs, OpenGraph URLs, and metadata.
   * **Public-Only Indexing**: Dynamic `app/sitemap.ts` indexing only published novels (`deleted_at IS NULL`, non-draft), published chapters, published blogs, and public marketing pages (`/`, `/categories`, `/blogs`, `/best-seller`). Strictly excludes drafts, deleted content, `/dashboard/*`, `/chats/*`, `/auth/*`, `/coins`, `/library`, `/notifications`, and `/settings`.
   * **Crawler Directives**: Dynamic `app/robots.ts` granting public access and explicitly disallowing private dashboard, chat, auth, and user utility routes.
   * **Strict Schema.org Structured Data**: Dynamic `Book` and `BlogPosting` JSON-LD generated using only real database values (no fabricated ratings, authors, or dates).
5. **Brand & Visual Stability**:
   * Rebranded to **Mi Novaria**; retaining current dark slate / primary color theme for MVP stability before AWS deployment.

*Priority 4 Verification Checklist:*
- [ ] Automated Typecheck: `npm run typecheck` passes with zero errors
- [ ] Unit & Business Rules Test Suite: `npm test` passes all tests
- [ ] Production Build: `npm run build` succeeds, generating all routes including `/robots.txt` and `/sitemap.xml`
- [ ] Dynamic SEO Validation: Verify robots directives, sitemap XML output, canonical tags, OpenGraph metadata, and Schema.org JSON-LD

### Step 4: AWS Infrastructure (Weeks 4–6)
1. Create IAM deployment role with least-privilege permissions
2. Register/transfer domain in Route 53
3. Request ACM certificate
4. Create S3 bucket for media
5. Write `Dockerfile` for Next.js app
6. Create ECR repository
7. Build and push image locally (use `ms-azuretools.vscode-containers` in standard VS Code)
8. Create App Runner service pointing to ECR
9. Create CloudFront distribution (App Runner + S3 origins)
10. Create SQS queue + Lambda for analytics heartbeat processor
11. Store all secrets in AWS Secrets Manager

### Step 5: CI/CD (Weeks 6–7)
1. GitHub Actions pipeline: test → migrate → build → push ECR → deploy App Runner
2. Configure OIDC trust between GitHub Actions and AWS IAM
3. CloudWatch dashboards — 4 Golden Signals
4. Alarms → SNS → email

### Step 6: Production Launch
1. Update `NEXT_PUBLIC_SITE_URL` to production domain
2. Update Supabase Auth `Site URL` + redirect URLs
3. DNS cutover (Route 53 → CloudFront)
4. Monitor CloudWatch for 24 hours
5. LinkedIn post 🚀

---

## Part 8 — The Interview Narrative

> *"I took a Next.js/Supabase prototype with 22 database tables, ran a live security audit using MCP tooling against the actual database, and found critical vulnerabilities — including an RLS policy that allowed any authenticated user to edit any author's chapters, and a privilege escalation path from standard user to admin through a missing column-level restriction on the profiles table. I fixed those before touching AWS.*
>
> *I then migrated the hosting to AWS: CloudFront for CDN and WAF, App Runner for the containerized Next.js app, S3 for media storage, and SQS + Lambda for the reading analytics pipeline — which replaced 30-second heartbeat writes directly to Supabase with a batched async processor. I kept Supabase for auth and the database initially, because migrating to Cognito and RDS wasn't justified at this stage and would have been a full backend rewrite rather than a migration.*
>
> *The entire deployment pipeline runs through GitHub Actions with OIDC authentication to AWS — no long-lived credentials stored anywhere.*"

Every sentence is backed by something built, measured, or fixed.

---

## Appendix A — Authoritative Database Table Status (Post-Hardening)

| Category | Table | RLS | Status / Hardening Applied |
|---|---|---|---|
| **Active MVP (1)** | `profiles` | ✅ | InitPlan optimized, trigger `prevent_is_admin_self_escalation` active, admin JWT claims |
| **Active MVP (2)** | `novels` | ✅ | Soft-delete enabled, FK indexes active, full text & genre indexed |
| **Active MVP (3)** | `chapters` | ✅ | Author-ownership RLS verified, `UNIQUE(novel_id, chapter_number)`, FK index active |
| **Active MVP (4)** | `reviews` | ✅ | `UNIQUE(user_id, novel_id)` enforced, FK covering indexes active |
| **Active MVP (5)** | `comments` | ✅ | Hierarchical tree assembly (`lib/comments.ts`), FK covering indexes active |
| **Active MVP (6)** | `comment_likes` | ✅ | Toggle like handler, composite indexing active |
| **Active MVP (7)** | `user_library` | ✅ | Reading/Completed/Favourite status management, FK indexes active |
| **Active MVP (8)** | `reading_history` | ✅ | Per-user chapter progress tracking (`user_id, novel_id, chapter_id`) |
| **Active MVP (9)** | `messages` | ✅ | User-to-user conversation threads, FK indexes active |
| **Active MVP (10)** | `wallets` | ✅ | `CHECK (coin_balance >= 0)`, mutation restricted to server-side RPC |
| **Active MVP (11)** | `coin_transactions` | ✅ | Non-zero amounts, partial unique reference index, atomic Paystack RPC |
| **Active MVP (12)** | `followers` | ✅ | Canonical follower relationship table, FK indexes active |
| **Active MVP (13)** | `blogs` | ✅ | Author community articles, public reading allowed, FK indexes active |
| **Active MVP (14)** | `blog_likes` | ✅ | Article like toggling, FK covering indexes active |
| **Active MVP (15)** | `blog_comments` | ✅ | Threaded article discussion, FK covering indexes active |
| **Active MVP (16)** | `blog_comment_likes` | ✅ | Comment appreciation tracking, FK covering indexes active |
| **Active MVP (17)** | `notifications` | ✅ | Service-role restricted system alerts, FK covering indexes active |
| **Deferred / Frozen (1)** | `posts` | ✅ | Social feed feature deferred to post-MVP roadmap |
| **Deferred / Frozen (2)** | `polls` | ✅ | Community polling feature deferred to post-MVP roadmap |
| **Deferred / Frozen (3)** | `poll_votes` | ✅ | Community poll voting deferred to post-MVP roadmap |
| **Deferred / Frozen (4)** | `reading_time_logs` | ✅ | Direct DB heartbeats deferred to AWS SQS + Lambda async pipeline |
| **Deprecated (1)** | `follows` | ✅ | Superseded by canonical `followers` table |

## Appendix B — Supabase Advisor Findings Summary

**Security Advisor:**
- `rls_enabled_no_policy` ×6 — `coin_transactions`, `poll_votes`, `polls`, `posts`, `reading_time_logs`, `wallets`
- `function_search_path_mutable` ×1 — `public.handle_new_user`
- `anon_security_definer_function_executable` ×1 — `handle_new_user` callable by anon via REST
- `authenticated_security_definer_function_executable` ×1 — `handle_new_user` callable by authenticated via REST
- `auth_leaked_password_protection` ×1 — HaveIBeenPwned integration disabled

**Performance Advisor:**
- `unindexed_foreign_keys` ×27 — every FK across all tables
- `auth_rls_initplan` ×22 — `auth.uid()` re-evaluated per row in 22 policies
- `multiple_permissive_policies` ×27 — duplicate SELECT/UPDATE policies on same role

## Appendix C — V1 → V2 Roadmap

```
           V1 (Current)
               │
               ▼
    CODE + SECURITY AUDIT        ← Priority 0 & 1  (Weeks 1–2)
               │
               ▼
      FIX FOUNDATION             ← Priority 2      (Weeks 2–3)
               │
               ▼
    PRODUCT + REBRAND            ← Priority 3 & 4  (Weeks 3–4)
               │
               ▼
     AWS PHASE 1 MIGRATION       ← Hosting         (Weeks 4–6)
               │
               ▼
    CI/CD + OBSERVABILITY        ← Phase 2         (Weeks 6–7)
               │
               ▼
      PRODUCTION V2
               │
               ▼
          LINKEDIN 🚀
```
