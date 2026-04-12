<p align="center">
  <a href="https://github.com/mindtris/mintax">
    <img src="public/logo/logo.svg" width="120" alt="Mintax by Mindtris" />
  </a>
</p>

<h1 align="center">Mintax</h1>

<p align="center">
  <strong>The intelligent business operating system for modern enterprises.</strong><br/>
  <sub>An open source platform by <a href="https://www.mindtris.com">Mindtris</a></sub>
</p>

<p align="center">
  <a href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmindtris%2Fmintax&env=DATABASE_URL,BETTER_AUTH_SECRET,NEXT_PUBLIC_APP_URL&project-name=mintax&repository-name=mintax">
    <img src="https://vercel.com/button" alt="Deploy with Vercel" />
  </a>
</p>

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-AGPL_3.0-c96442?style=flat-square" alt="License" /></a>
  <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js_15-141413?style=flat-square&logo=next.js" alt="Next.js" /></a>
  <a href="https://www.prisma.io"><img src="https://img.shields.io/badge/Prisma-c96442?style=flat-square&logo=prisma" alt="Prisma" /></a>
  <a href="https://github.com/mindtris/mintax/discussions"><img src="https://img.shields.io/badge/community-discussions-141413?style=flat-square&logo=github" alt="Discussions" /></a>
</p>

---

## Overview

**Mintax** is a comprehensive, multi-tenant business operating system for modern companies. It unifies accounting, sales, hiring, social engagement, and team operations in one open source platform — secured by enterprise-grade infrastructure and extended by a configurable AI engine.

Built for **sovereignty** and **scalability**, Mintax can be self-hosted on your own infrastructure, giving you complete control over your business data.

## Core modules

| Module | What it does |
|--------|--------------|
| **Accounts** | Transactions, bills, bank reconciliation, multi-currency, financial reports |
| **Sales** | Invoices, estimates, leads, customers, pipeline tracking |
| **Hire** | Job postings, candidate pipeline, bench management, career portals |
| **Engage** | Multi-platform social posting across 28+ networks with scheduling and analytics |
| **People** | Team directory, quicklinks, reminders, role management |
| **Apps** | Invoice PDF generator, reminders, Outlook integration |
| **Settings** | Email templates, invoice templates, schedules, LLM providers, social accounts |

## Documentation

All project documentation lives in [`/docs`](./docs):

| Document | Purpose |
|----------|---------|
| [Open Source](./docs/OPENSOURCE.md) | Why Mintax is open source, license, contributors, credits |
| [Roadmap](./docs/ROADMAP.md) | What we're building next and what contributors can pick up |
| [Contributing](./docs/CONTRIBUTING.md) | How to contribute code, docs, tests, and ideas |
| [Code of Conduct](./docs/CODE_OF_CONDUCT.md) | Community standards |
| [AI Architecture](./docs/AI.md) | How the LLM layer is designed |

## AI engine

Mintax features a configurable AI assistance layer (via **LangChain**) supporting:

- **Cloud providers** — OpenAI, Google Gemini, Mistral AI
- **Local sovereignty** — Ollama integration for on-prem models
- **Module-specific prompts** — tailored logic per business task

Configure via `/settings?tab=llm`.

## Tech stack

| Layer | System |
|-------|--------|
| **Framework** | Next.js 15 (App Router), React 19, TypeScript |
| **Database** | PostgreSQL, Prisma ORM |
| **Auth** | Better Auth with multi-layered sessions |
| **AI** | LangChain Core |
| **UI** | Tailwind CSS, Radix UI, Lucide icons, shadcn/ui |
| **Services** | Stripe (payments), Resend (email), S3/Vercel Blob (storage) |

## Quick start

### Prerequisites

- Node.js 18+ and `pnpm`
- PostgreSQL (Neon, Supabase, or local)
- API keys for your preferred LLM provider (optional — Ollama works too)

### Local setup

```bash
# 1. Clone
git clone https://github.com/mindtris/mintax.git
cd mintax

# 2. Install
pnpm install

# 3. Configure
cp .env.example .env
# Fill in DATABASE_URL and BETTER_AUTH_SECRET at minimum

# 4. Push schema
pnpm prisma db push --schema=lib/prisma/schema.prisma

# 5. Start
pnpm dev
```

Open `http://localhost:8080`.

## Deployment

Deploy to production with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmindtris%2Fmintax&env=DATABASE_URL,BETTER_AUTH_SECRET,NEXT_PUBLIC_APP_URL)

### Essential environment variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Secret key for session encryption (min 16 chars) |
| `NEXT_PUBLIC_APP_URL` | Public URL of your deployment |

See [`.env.example`](./.env.example) for the full list of environment variables.

## Community

- [Discussions](https://github.com/mindtris/mintax/discussions) — ask questions, share ideas
- [Issues](https://github.com/mindtris/mintax/issues) — report bugs, request features
- [Roadmap](./docs/ROADMAP.md) — see what's coming and pick something to build
- [support@mindtris.com](mailto:support@mindtris.com) — commercial inquiries

## License

Mintax is licensed under the [GNU AGPL v3.0](./LICENSE).

You can use, modify, and distribute it freely. If you host a modified version as a network service, you must share your changes under the same license.

For commercial licensing (proprietary deployments, white-labeling, embedded use), contact [support@mindtris.com](mailto:support@mindtris.com).

---

<p align="center">
  <strong>Powered by <a href="https://www.mindtris.com">Mindtris</a> (Mintax)</strong><br/>
  <sub>Made with care, shared with everyone.</sub>
</p>
