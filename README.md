# NovelApp

NovelApp is a Serialized Web Novel & Social Network Platform. It is engineered using a **Serverless-First, Modular Architecture** optimized for high performance, sub-50ms text delivery, and zero foundational infrastructure billing overhead.

## Core Technologies

* **Frontend & API Engine:** Next.js (App Router), Tailwind CSS, TypeScript, shadcn/ui
* **Hosting Architecture:** Vercel for frontend assets and backend Serverless Edge Functions
* **Database & Identity:** Supabase (PostgreSQL) providing row-level security (RLS) and integrated JWT generation
* **Storage Infrastructure:** Cloudflare R2 Object Storage for cover images and Markdown files

## Features

- **Reader Portal:** Global search, category dropdowns, and optimized reading experience.
- **Studio Dashboard:** Visual diagnostic matrix, book configurator, and rich-text chapter editing.
- **Social & Engagement:** Reviews, nested comments, profile timelines, and interactive polls.
- **Monetization:** Wallet integration for micro-transactions and chapter unlocking.

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the app.

## Documentation

For a detailed breakdown of the database schema, frontend routing matrix, and system module design, please refer to the [System Architecture & Product Specification](./novelApp.md).
