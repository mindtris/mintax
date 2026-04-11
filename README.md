<p align="center">
  <img src="public/logo/logo.svg" width="480" alt="mintax" />
</p>

<h1 align="center" style="border: none;">mintax</h1>

<p align="center">
  <strong>Multi-tenant bookkeeping platform for modern businesses</strong>
</p>

<p align="center">
  <a href="#features"><img src="https://img.shields.io/badge/AI_Powered-c96442?style=flat-square" alt="AI Powered" /></a>
  <a href="#features"><img src="https://img.shields.io/badge/Multi_Tenant-141413?style=flat-square" alt="Multi Tenant" /></a>
  <a href="#features"><img src="https://img.shields.io/badge/Self_Hosted-c96442?style=flat-square" alt="Self Hosted" /></a>
  <a href="#tech-stack"><img src="https://img.shields.io/badge/Next.js_15-141413?style=flat-square" alt="Next.js 15" /></a>
  <a href="#tech-stack"><img src="https://img.shields.io/badge/PostgreSQL-c96442?style=flat-square" alt="PostgreSQL" /></a>
</p>

<br />

<p align="center">
  Manage expenses, invoices, contacts, hiring, and social media across multiple businesses — with AI that runs on your terms.
</p>

---

## Features

**Accounts** — Transactions, bank reconciliation, bills, reports, multi-currency (170+ currencies)

**Sales** — Invoices, estimates, contacts, products & services

**Hire** — Job postings, candidate pipeline, screening, AI-generated job descriptions

**Engage** — Social media management, content scheduling, AI-powered post generation

**AI** — Configurable prompts per module, multiple LLM providers, local model support via Ollama

**Settings** — Taxes, categories, projects, custom fields, currencies — all managed through a unified DataGrid interface

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15, React 19, TypeScript |
| Styling | Tailwind CSS, Radix UI |
| Database | PostgreSQL, Prisma ORM |
| AI | LangChain — OpenAI, Gemini, Mistral, Ollama |
| Auth | better-auth (email OTP) |
| Payments | Stripe |
| Email | Resend |
| Storage | Local filesystem or S3-compatible (R2, MinIO) |

## Quick Start

```bash
git clone git@github.com:mindtris/mintax.git
cd mintax
cp .env.example .env

# Install & run
pnpm install
pnpm dev
```

Open [localhost:7331](http://localhost:7331)

## Deploy

**Vercel** — connect the repo, set environment variables, deploy.

**Docker** — `docker compose up -d`

**Kubernetes** — use Ollama as a sidecar for local LLM inference.

## Configuration

All configuration via environment variables. See [.env.example](.env.example).

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection |
| `BETTER_AUTH_SECRET` | Yes | Auth secret (min 16 chars) |
| `STORAGE_PROVIDER` | Yes | `local` or `s3` |
| `OPENAI_API_KEY` | One AI key required | OpenAI |
| `GOOGLE_API_KEY` | | Google Gemini |
| `MISTRAL_API_KEY` | | Mistral |

For local LLM (Ollama), no API key needed — configure the base URL at `/settings/llm`.

---

<p align="center">
  <sub>Built by <a href="https://github.com/mindtris">mindtris</a></sub>
</p>
