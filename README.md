<p align="center">
  <img src="public/logo/logo.svg" width="480" alt="mintax" />
</p>

<h1 align="center">mintax</h1>

<p align="center">
  <strong>Multi-tenant bookkeeping and business management platform for modern enterprises</strong>
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
  A comprehensive platform to manage expenses, invoicing, hiring, client relationships, and social media presence across multiple businesses — powered by configurable AI that runs on your infrastructure.
</p>

---

## Features

**Accounts**  
Comprehensive financial management including transactions, bank reconciliation, bills, financial reports, and support for 170+ currencies.

**Sales**  
Invoice creation, estimates, contact management, product catalog, and service management.

**Hire**  
End-to-end recruitment module with job postings, candidate pipeline tracking, screening tools, and AI-generated job descriptions.

**Engage**  
Social media management with content scheduling and AI-powered post generation across multiple platforms.

**AI Assistant**  
Flexible AI capabilities with per-module prompt configuration, support for multiple LLM providers, and local model integration via Ollama.

**Settings & Administration**  
Unified management of taxes, categories, projects, custom fields, and currencies through an advanced DataGrid interface.

## Tech Stack

| Layer          | Technology                                      |
|----------------|-------------------------------------------------|
| Framework      | Next.js 15, React 19, TypeScript               |
| Styling        | Tailwind CSS, Radix UI                          |
| Database       | PostgreSQL with Prisma ORM                      |
| AI Integration | LangChain, OpenAI, Gemini, Mistral, Ollama     |
| Authentication | better-auth (Email OTP)                         |
| Payments       | Stripe                                          |
| Email          | Resend                                          |
| Storage        | Local filesystem or S3-compatible (R2, MinIO)  |

## Quick Start

```bash
git clone git@github.com:mindtris/mintax.git
cd mintax

cp .env.example .env

pnpm install
pnpm dev
