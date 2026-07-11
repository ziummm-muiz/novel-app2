# TECHNICAL SYSTEM ARCHITECTURE & PRODUCT SPECIFICATION

### **Project:** Serialized Web Novel & Social Network Platform

### **Target Infrastructure Cost:** $0 USD Foundational Overhead

---

## 1. HIGH-LEVEL SYSTEM ARCHITECTURE

The platform is engineered using a **Serverless-First, Modular Architecture** optimized for high performance, sub-50ms text delivery, and zero foundational infrastructure billing overhead.
```

```
             [ CLIENT BROWSER ]
                    │
                    ▼ (DNS & Edge Caching)
           [ CLOUDFLARE CDN ]
                    │
     ┌──────────────┴──────────────┐
     ▼ (Frontend & Serverless API)  ▼ (Static Asset Storage)

```

[ VERCEL HOSTING ] [ CLOUDFLARE R2 ]
(Next.js App Router) (Book Covers & Markdown Files)
│
├─► [ SUPABASE AUTH ] (JWT Handling & Session Management)
│
└─► [ SUPABASE POSTGRES ] (Relational Storage Engine)

```

### Core Technologies
* **Frontend & API Engine:** Next.js (App Router), Tailwind CSS, TypeScript.
* **Hosting Architecture:** Vercel (Hobby Tier) for frontend assets and backend Serverless Edge Functions.
* **Database & Identity:** Supabase (Free Tier PostgreSQL) providing row-level security (RLS) and integrated JWT generation.
* **Storage Infrastructure:** Cloudflare R2 Object Storage (10GB Free Tier) eliminating data egress bandwidth costs.
* **Payment Gateways:** Paystack or Flutterwave SDK API frameworks optimized for regional cards, bank transfers, mobile money, and cross-border multi-currency routing.

---

## 2. DATABASE SCHEMA MATRIX (15 TABLES)

To support relational analytics, automated time-based chapter release filters, soft deletes, self-referencing message trees, and transaction-safe wallet ledgers, the PostgreSQL database is structured as follows:


```

```
           ┌────────────────┐
           │     users      │
           └───────┬────────┘
                   │ (1:N)
     ┌─────────────┼────────────────────────┐
     ▼ (1:N)       ▼ (1:N)                  ▼ (1:N)

```

┌────────────────┐ ┌────────────────┐ ┌──────────────────┐
│ novels │ │ wallet_coins │ │ reading_progress │
└────────┬───────┘ └────────────────┘ └────────┬─────────┘
│ (1:N) │
▼ │ (Refers to)
┌────────────────┐ │
│ chapters │◄──────────────────────────────┘
└────────────────┘

````

### 👤 Identity & Social Tables
1.  **`profiles`**
    * `id`: `UUID` (Primary Key, matches Supabase Auth `user.id`)
    * `username`: `VARCHAR(50) UNIQUE`
    * `avatar_url`: `TEXT`
    * `bio`: `TEXT`
    * `discography`: `TEXT` (Author portfolio data)
    * `is_admin`: `BOOLEAN DEFAULT FALSE`
    * `created_at`: `TIMESTAMP DEFAULT NOW()`
2.  **`messages`**
    * `id`: `UUID` (Primary Key)
    * `sender_id`: `UUID` (FK -> `profiles.id`)
    * `receiver_id`: `UUID` (FK -> `profiles.id`)
    * `message_text`: `TEXT`
    * `is_read`: `BOOLEAN DEFAULT FALSE`
    * `created_at`: `TIMESTAMP DEFAULT NOW()`

### 📚 Content Tables
3.  **`novels`**
    * `id`: `UUID` (Primary Key)
    * `author_id`: `UUID` (FK -> `profiles.id`)
    * `title`: `VARCHAR(255)`
    * `synopsis`: `TEXT`
    * `cover_url`: `TEXT` (Points to Cloudflare R2 bucket asset)
    * `genres`: `TEXT[]` (PostgreSQL text array for fast indexing)
    * `is_featured`: `BOOLEAN DEFAULT FALSE`
    * `deleted_at`: `TIMESTAMP` (Null by default; populated for soft deletes)
4.  **`chapters`**
    * `id`: `UUID` (Primary Key)
    * `novel_id`: `UUID` (FK -> `novels.id` ON DELETE CASCADE)
    * `chapter_number`: `INTEGER`
    * `title`: `VARCHAR(255)`
    * `content_url`: `TEXT` (Points to `.md` text file in Cloudflare R2)
    * `coin_cost`: `INTEGER DEFAULT 0`
    * `status`: `VARCHAR(20)` (`'draft'`, `'scheduled'`, `'published'`)
    * `published_at`: `TIMESTAMP`

### 💬 Engagement & Social Tables
5.  **`reviews`**
    * `id`: `UUID` (Primary Key)
    * `user_id`: `UUID` (FK -> `profiles.id`)
    * `novel_id`: `UUID` (FK -> `novels.id`)
    * `rating`: `INTEGER` (Constraint: 1 to 5)
    * `review_text`: `TEXT`
    * `created_at`: `TIMESTAMP DEFAULT NOW()`
6.  **`comments`**
    * `id`: `UUID` (Primary Key)
    * `user_id`: `UUID` (FK -> `profiles.id`)
    * `target_id`: `UUID` (Can represent a `novel_id` or a `chapter_id`)
    * **`parent_id`**: `UUID` (Self-referencing FK -> `comments.id` for hierarchical nesting tree)
    * `comment_text`: `TEXT`
    * `created_at`: `TIMESTAMP DEFAULT NOW()`
7.  **`comment_likes`**
    * `id`: `UUID` (Primary Key)
    * `user_id`: `UUID` (FK -> `profiles.id`)
    * `comment_id`: `UUID` (FK -> `comments.id` ON DELETE CASCADE)
    * *Constraint:* `UNIQUE (user_id, comment_id)` (Prevents duplicate liking parameters)

### 📊 Analytics & Feed Tables
8.  **`user_library`**
    * `id`: `UUID` (Primary Key)
    * `user_id`: `UUID` (FK -> `profiles.id`)
    * `novel_id`: `UUID` (FK -> `novels.id`)
    * `status`: `VARCHAR(20)` (`'reading'`, `'completed'`, `'favourite'`)
9.  **`reading_history`**
    * `id`: `UUID` (Primary Key)
    * `user_id`: `UUID` (FK -> `profiles.id`)
    * `chapter_id`: `UUID` (FK -> `chapters.id`)
    * `novel_id`: `UUID` (FK -> `novels.id`)
    * `last_read_at`: `TIMESTAMP DEFAULT NOW()`
10. **`reading_time_logs`**
    * `id`: `UUID` (Primary Key)
    * `user_id`: `UUID` (FK -> `profiles.id`)
    * `novel_id`: `UUID` (FK -> `novels.id`)
    * `duration_seconds`: `INTEGER`
    * `logged_date`: `DATE DEFAULT CURRENT_DATE`
11. **`posts`**
    * `id`: `UUID` (Primary Key)
    * `user_id`: `UUID` (FK -> `profiles.id`)
    * `content`: `TEXT`
    * `created_at`: `TIMESTAMP DEFAULT NOW()`
12. **`polls`**
    * `id`: `UUID` (Primary Key)
    * `post_id`: `UUID` (FK -> `posts.id` ON DELETE CASCADE)
    * `question`: `VARCHAR(255)`
    * `options`: `TEXT[]` (Array of selectable option strings)
    * `expires_at`: `TIMESTAMP`
13. **`poll_votes`**
    * `id`: `UUID` (Primary Key)
    * `user_id`: `UUID` (FK -> `profiles.id`)
    * `poll_id`: `UUID` (FK -> `polls.id` ON DELETE CASCADE)
    * `option_index`: `INTEGER`
    * *Constraint:* `UNIQUE (user_id, poll_id)` (Enforces singular ballot entry per user)

### 💳 Financial Ledger Tables
14. **`wallets`**
    * `id`: `UUID` (Primary Key)
    * `user_id`: `UUID` (FK -> `profiles.id`)
    * `coin_balance`: `INTEGER DEFAULT 0`
15. **`coin_transactions`**
    * `id`: `UUID` (Primary Key)
    * `user_id`: `UUID` (FK -> `profiles.id`)
    * `amount`: `INTEGER` (Positive for credit injections, negative for debt authorizations)
    * `type`: `VARCHAR(20)` (`'deposit'`, `'purchase_chapter'`)
    * `reference`: `VARCHAR(100)` (Gateway signature reference transaction ID)

---

## 3. FRONTEND ROUTING & INTERFACE MATRIX

### Global Application States (React Context / Providers)
* **`AuthContext`:** Exposes active Supabase authentication status, JWT sessions, and the `is_admin` security flag.
* **`WalletContext`:** Syncs user coin totals and manages ledger updates during purchases.
* **`ThemeContext`:** Powers customizable typography backgrounds for readers (Cream, Sepia, Charcoal, Obsidian).

---

### Layout Group A: The Public Reader Portal
*All user routes share a sticky navigation bar (Global Search, Category Dropdowns, Balance Trackers, and Profile Controls).*

* **`/` — Homepage:** Houses hero blocks displaying editorially selected "Featured Books", alongside carousels sorting "Trending Today" (calculated from high comment/like metrics over the last 24 hours), "Top Rated", and "Top Authors".
* **`/explore` — Search Directory:** A split-pane layout with dynamic filter controls for categories, rating values, and completion status. Fetches updates natively using URL parameters (`/explore?genre=litrpg&sort=recent`).
* **`/novel/[novelId]` — Novel Overview:** Tabbed interface mapping out story abstracts, user star reviews, and a chapter directory highlighting locked vs. unlocked items.
* **`/novel/[novelId]/chapter/[chapterNum]` — Content Screen:** Centered, reading-optimized typography wrapper (`max-w-2xl`) with customizable font controls. Includes a floating paywall block that overrides rendering if a chapter is premium and locked. Includes an active background JavaScript heartbeat that tracks active visibility and bundles time tracking metrics.
* **`/profile/[username]` — Public Space:** Tabbed bio center rendering public reading logs, creator discography list arrays, and a social timeline managing profile posts and interactive poll widgets.
* **`/messages` — Chat Inbox:** Two-column communication screen managing real-time direct chat histories.
* **`/wallet` — Transaction Hub:** Displays the user's active wallet balance and presents pre-priced token deposit package grids linked to inline Paystack/Flutterwave checkout popups.

---

### Layout Group B: The Studio Dashboard
*Protected via middleware checks. Hides public navigation and substitutes a vertical administrative control sidebar.*

* **`/dashboard` — Main Analytics Engine:** A visual diagnostic matrix charting active platform reading metrics, total profile subscribers, and revenue reporting data.
* **`/dashboard/write/new` — Book Configurator:** Setup canvas for configuring novel details, applying multi-select tags, and processing book cover art storage streams.
* **`/dashboard/write/[novelId]/chapters` — Chapter Index:** Listing management panel logging chapter configurations (`Draft`, `Scheduled`, or `Published`) equipped with editing and soft-delete tools.
* **`/dashboard/write/[novelId]/chapters/new` — Text Workspace:** Distraction-free rich text input arena (TipTap or Quill integration) containing manual date/time configuration boxes to feed advanced chapter scheduling algorithms.

---

### Layout Group C: Global System Administration
*Restricted behind route guards verifying profile `is_admin == true` data states.*

* **`/admin` — Global Overview Center:** Summarizes aggregate metrics indicating global account signups, platform transaction fees processed, and active automated content flags.
* **`/admin/moderation` — System Moderation Queue:** Logs user content flags, allowing system administrators to execute immediate deletion overrides on comments or flag toxic profiles.

---

## 4. SYSTEM MODULE DESIGN & LOGIC LIFECYCLES

The system's underlying business rules are divided into six lightweight backend controller clusters:

### 1. Auth & Profiles Cluster
* Processes client JWT authorization keys on protected API endpoints.
* Handles profile updates, image asset processing for custom avatars, and returns unified public actor profiles.

### 2. Novels & Scheduling Engine
* Manages the assembly of book configurations and coordinates media uploads to cloud storage blocks.
* **Automated Scheduling Rule:** To avoid expensive background server processing scripts to launch chapters, automated publishing is achieved via time-based database queries:
    ```sql
    SELECT * FROM chapters
    WHERE novel_id = $1
      AND status = 'published'
      AND published_at <= NOW()
    ORDER BY chapter_number ASC;
    ```

### 3. Threaded Comment Processing Module
* Pulls structural raw rows from the `comments` table using nested SQL parent logic.
* **Tree Transformation Loop:** Before returning JSON results to the client, a Next.js API reducer maps flat relational rows into structured trees:
    ```typescript
    export function nestComments(flatComments: any[]) {
      const map: Record<string, any> = {};
      const tree: any[] = [];
      flatComments.forEach(c => map[c.id] = { ...c, children: [] });
      flatComments.forEach(c => {
        if (c.parent_id) map[c.parent_id]?.children.push(map[c.id]);
        else tree.push(map[c.id]);
      });
      return tree;
    }
    ```

### 4. Interactive Engagement & Polls System
* Coordinates the storage of reviews, nested comment logs, and updates matching comment likes.
* Handles vote routing, utilizing `unique_user_vote` table index constraints to block duplicate votes, and maps live voting results instantly via database aggregations:
    ```sql
    SELECT option_index, COUNT(id) as total_votes
    FROM poll_votes WHERE poll_id = $1 GROUP BY option_index;
    ```

### 5. High-Precision Reading Analytics Engine
* Handles 30-second ping logs dispatched from active reading client screens.
* **Upsert Telemetry Query:** Increments time duration sheets dynamically using unique data constraints:
    ```sql
    INSERT INTO reading_time_logs (user_id, novel_id, duration_seconds, logged_date)
    VALUES ($1, $2, 30, CURRENT_DATE)
    ON CONFLICT (user_id, novel_id, logged_date)
    DO UPDATE SET duration_seconds = reading_time_logs.duration_seconds + 30;
    ```

### 6. Wallet & Financial Processing Module
* Listens for secure signature-validated gateway webhooks (`/api/webhooks/payment`) to handle wallet credits.
* **Wallet Credit Architecture:** To prevent small transaction fees from eating platform profits, micro-payments are blocked. Users deposit funds into a credit balance pool ($10 or ₦5,000 minimum). Unlocking chapters handles safe internal transaction balance transfers inside your local database without hitting payment networks again.
* **Author Payout Automations:** Withdrawals hit Paystack/Flutterwave's direct Transfer API routes, verifying recipient names instantly before dispatching funds from the platform business account directly into the author's local bank account.

---

## 5. ROADMAP STRATEGY: PROGRESSIVE SCALING

### Phase 1: Core Minimum Viable Product (MVP)
* **Objective:** Launch basic reading and content storage loops on a 100% free hosting layout.
* **Tasks:** Build out the public reading routes using Next.js. Establish the creator workspace and route rich-text inputs straight to Cloudflare R2 as `.md` files. Use the query-time filtering method to handle scheduled releases for free.

### Phase 2: Engagement Escalation
* **Objective:** Layer on advanced social network modules to maximize platform user activity.
* **Tasks:** Activate the hierarchical comment nesting controllers and add optimistic UI liking hooks. Integrate the active analytics engine interval script to compile reading time data, and set up profile posts and interactive polling.

### Phase 3: Monetization & Wallet Integration
* **Objective:** Deploy financial transaction flows and global creator monetization mechanics.
* **Tasks:** Activate the wallet database tables. Secure the Paystack/Flutterwave webhook API endpoint to process incoming wallet funds. Build out the chapter unlock ledger systems and write the automated payout scripts via the transfer gateways.

````
