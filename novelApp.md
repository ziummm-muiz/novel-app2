# ARCHIVED — Historical Technical Specification

> [!WARNING]
> **This document is archived and should not be used as a reference.**
>
> It describes the original V1 prototype architecture and has been superseded by the documents below. The information in this file is **intentionally out of date** and retained only for historical context.

---

## Why this file is archived

This file (`novelApp.md`) was the original product specification for the V1 prototype. It has been superseded because:

| Claim in this file | Current reality |
|---|---|
| `$0 USD Foundational Overhead` | Target infrastructure is AWS (CloudFront + App Runner + S3) |
| Vercel hosting | Target host is AWS App Runner (containerized Next.js) |
| Cloudflare CDN | Target CDN is Amazon CloudFront + WAF |
| Cloudflare R2 storage | Supabase Storage (`covers` bucket) for novel artwork |
| 15-table schema | Live PostgreSQL database has 22 tables (17 Active MVP, 4 Deferred, 1 Deprecated) |
| `any[]` TypeScript in nestComments | Fully typed: `CommentWithMeta[]` → `CommentNode[]` (Priority 3 audit) |
| Unverified performance claims | Removed — no sub-50ms or billing overhead claims |
| `chapters.content_url` → `.md` files in R2 | `chapters.content_url` now stores inline markdown content |
| 6 business logic clusters (theoretical) | Implemented: DAL (`lib/dal/`), Zod validation (`lib/validations/`), typed Server Actions |

---

## Authoritative current documentation

| Document | Purpose |
|---|---|
| [README.md](./README.md) | Current product overview: implemented features, tech stack, table strategy, test coverage |
| [replatforming.md](./replatforming.md) | Live security audit, data integrity findings, AWS target architecture, and completed Priority checklist |

---

*Archived: September 2026 — Priority 4 (Product & MVP Definition)*
