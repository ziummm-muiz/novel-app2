# Mi Novaria

Mi Novaria is a modern serialized web novel and reader-author community platform built with Next.js (App Router), TypeScript, and PostgreSQL.

The application has been hardened through a rigorous security, data integrity, and architectural audit in preparation for cloud deployment to AWS.

---

## System Architecture & Technologies

* **Frontend & Application Server:** [Next.js](https://nextjs.org/) (App Router, Server Actions, React Server Components), React 19, TypeScript
* **Styling & UI:** Tailwind CSS, [shadcn/ui](https://ui.shadcn.com/), Lucide Icons
* **Data Access & Validation:** Pragmatic Data Access Layer (`lib/dal/`), [Zod](https://zod.dev/) runtime boundary validation, live-generated Supabase database types (`types/database.types.ts`)
* **Database & Identity:** [Supabase](https://supabase.com/) PostgreSQL with Row Level Security (RLS), InitPlan query optimizations, and JWT admin claims (`app_metadata.is_admin`)
* **Media Storage:** Supabase Storage (`covers` bucket) for novel artwork
* **Payments & Financial Ledger:** [Paystack](https://paystack.com/) payment gateway with cryptographic HMAC-SHA512 webhook verification and atomic idempotent PostgreSQL procedures
* **Target Cloud Infrastructure:** AWS (`eu-west-1`) — Amazon CloudFront CDN, AWS App Runner, Amazon S3, Route 53, and GitHub Actions OIDC CI/CD

---

## Feature Matrix & Product Status

### ✅ Implemented (MVP Ready & Hardened)

* **Reader Portal:**
  * Global novel search and category filtering (Fantasy, Romance, Sci-Fi, Action, Mystery, etc.).
  * Responsive chapter reading interface with markdown formatting and chapter navigation.
  * Personal library management: Reading, Completed, and Favourites categorization (`user_library`).
  * Reading history tracking linking recent chapters (`reading_history`).
* **Author Studio & Dashboard:**
  * Novel workspace: Creation, cover upload, metadata editing, genre tagging, and maturity rating configuration.
  * Chapter workspace: Numbered chapter creation, markdown content editor, soft deletion, and revision.
  * Administrative dashboard with platform-wide novel management and user restriction controls.
* **Community & Engagement:**
  * 5-star novel reviews with database-enforced unique constraints (`UNIQUE (user_id, novel_id)`).
  * Recursive threaded comments with orphan handling and stable sibling ordering (`lib/comments.ts`).
  * Comment like toggling and real-time like counts.
  * Author follow/unfollow network (`followers`).
  * Community author blogs: Long-form articles with dedicated comment and like systems.
* **Peer-to-Peer Messaging:**
  * Direct user-to-user conversation threading and message history (`messages`).
* **Security & Access Control:**
  * Custom JWT administrative claims (`app_metadata.is_admin`) verified without recurring database table lookups.
  * Column-level trigger protection preventing self-escalation of administrative privileges (`prevent_is_admin_self_escalation`).
  * Explicit, non-overlapping RLS policies for `INSERT`, `UPDATE`, and `DELETE` actions.
  * InitPlan optimization across all policies using `(SELECT auth.uid())` to prevent per-row re-evaluation.
* **Financial Integrity & Coin Wallet:**
  * Materialized coin wallet (`wallets.coin_balance >= 0`).
  * Cryptographic HMAC-SHA512 Paystack webhook handler with timing-safe comparison.
  * Atomic deposit fulfillment in PostgreSQL (`process_paystack_deposit`) backed by a partial unique index (`idx_coin_transactions_reference`).
* **Code Quality & Type Safety:**
  * Zero unjustified `any` across the codebase.
  * 23 automated unit and business-rule tests running on Vitest (`npm test`).

### 🟡 In Progress (AWS Replatforming & Release Polish)

* **Cloud Replatforming:** Containerization (Dockerfile), AWS App Runner hosting, CloudFront CDN caching, and automated GitHub Actions deployment.
* **Comprehensive SEO:** Dynamic XML sitemap (`/sitemap.xml`), `robots.txt`, OpenGraph metadata, and Schema.org `Book` JSON-LD structured data.

### 📋 Planned (Post-MVP Roadmap)

* **Chapter Coin Unlocks:** Automated micro-transactions to unlock premium/paywalled chapters from wallet balance.
* **Real-Time Messaging Enhancements:** Supabase Realtime broadcast channels with live user typing indicators and presence.
* **Asynchronous Reading Analytics Pipeline:** AWS SQS + Lambda batch ingestion to replace high-frequency database heartbeat writes.

---

## Database Schema & Table Strategy

The PostgreSQL database contains 22 tables classified into active MVP, deferred, and deprecated roles:

| Category | Count | Tables | Role / Strategy |
|---|---|---|---|
| **Active MVP** | **17** | `profiles`, `novels`, `chapters`, `reviews`, `comments`, `comment_likes`, `user_library`, `reading_history`, `messages`, `wallets`, `coin_transactions`, `followers`, `blogs`, `blog_likes`, `blog_comments`, `blog_comment_likes`, `notifications` | Core active product capabilities; covered by 26 FK indexes, RLS policies, and integrity constraints. |
| **Deferred / Frozen** | **4** | `posts`, `polls`, `poll_votes`, `reading_time_logs` | Schema remains in PostgreSQL; active UI features deferred to post-MVP releases to maintain strict project scope. |
| **Deprecated** | **1** | `follows` | Deprecated and superseded by `followers`. |

---

## Getting Started

### Prerequisites

* Node.js 18+
* Supabase CLI or active Supabase project

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/ziummm-muiz/novel-app2.git
cd novel-app2
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PAYSTACK_SECRET_KEY=your-paystack-secret-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Verification & Testing Commands

```bash
# Run TypeScript typecheck
npm run typecheck

# Run unit & authorization test suites (Vitest)
npm test

# Run Next.js production build
npm run build
```

---

## Documentation

* [AWS Replatforming Master Plan](./replatforming.md)
