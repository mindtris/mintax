<p align="center">
  <a href="https://github.com/mindtris/mintax">
    <img src="public/logo/logo.svg" width="480" alt="Mintax Enterprise Logo" />
  </a>
</p>

<h1 align="center">Mintax Enterprise</h1>

<p align="center">
  <strong>The Intelligent Business Operating System for Modern Enterprises.</strong>
</p>

<p align="center">
  <a href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmindtris%2Fmintax&env=DATABASE_URL,BETTER_AUTH_SECRET,NEXT_PUBLIC_APP_URL&project-name=mintax-enterprise&repository-name=mintax-enterprise">
    <img src="https://vercel.com/button" alt="Deploy with Vercel" />
  </a>
</p>

<p align="center">
  <a href="https://github.com/mindtris/mintax/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-Apache_2.0-c96442?style=flat-square" alt="License" /></a>
  <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js_15-141413?style=flat-square&logo=next.js" alt="Next.js" /></a>
  <a href="https://www.prisma.io"><img src="https://img.shields.io/badge/Prisma_ORM-c96442?style=flat-square&logo=prisma" alt="Prisma" /></a>
  <a href="https://langchain.com"><img src="https://img.shields.io/badge/AI_Powered-141413?style=flat-square" alt="AI Powered" /></a>
</p>

---

## Overview

**Mintax** is a comprehensive, multi-tenant bookkeeping and business operating system designed for modern enterprises. It provides a unified platform to manage financial operations, talent acquisition, customer relationships, and digital engagement—all powered by an extensible AI engine and secured by enterprise-grade infrastructure.

Built for **sovereignty** and **scalability**, Mintax can be self-hosted on your own infrastructure, ensuring you maintain complete control over your business data while benefiting from state-of-the-art AI capabilities.

## Core Modules

### Accounts & Finance
*   **Intelligent Reconciliation**: Automated bank matching with AI categorization.
*   **Global Operations**: Native support for 170+ currencies and multi-entity taxation.
*   **Financial Reporting**: Real-time balance sheets, P&L, and cash flow tracking.
*   **Payables & Receivables**: Full-cycle transaction management.

### Sales & CRM
*   **Invoicing & Estimates**: Professional, multi-currency invoicing with payment integration.
*   **Client Management**: 360-degree view of customer interactions and history.
*   **Cycle Tracking**: Manage the end-to-end sales pipeline from lead to settlement.

### Hire & Talent
*   **ATS Capabilities**: End-to-end talent acquisition workflow.
*   **AI Writing Assistant**: Generate optimized job descriptions and screening questions.
*   **Pipeline Management**: Visualize candidate stages with rich collaboration tools.

### Engage & Social
*   **Social Orchestration**: Multi-channel scheduling (Twitter, LinkedIn, Facebook).
*   **Content Planner**: Visual calendar for content strategy.
*   **AI Content Engine**: Generate platform-specific posts and imagery.

## AI Engine & Infrastructure

Mintax features a highly configurable AI assistance layer (via **LangChain**) that supports:
- **Cloud Providers**: OpenAI, Google Gemini, Mistral AI.
- **Local Sovereignty**: Integration with **Ollama** for running models on your own servers.
- **Prompt Engineering**: Module-specific logic for high-precision business tasks.

## Tech Stack

| Layer | System |
| :--- | :--- |
| **Framework** | Next.js 15 (App Router), React 19, TypeScript |
| **Persistence** | PostgreSQL, Prisma ORM |
| **Auth & Security** | Better-Auth with Multi-layered sessions |
| **Orchestration** | LangChain Core |
| **UI/UX** | Tailwind CSS 3.4, Radix UI, Lucide Icons |
| **Services** | Stripe (Payments), Resend (Email), S3/Vercel (Storage) |

## Quick Start

### Prerequisites
- Node.js 18+ and `pnpm`
- PostgreSQL instance
- API keys for your preferred LLM provider (optional for local models)

### Local Setup
1. **Clone & Install**
   ```bash
   git clone https://github.com/mindtris/mintax.git
   cd mintax
   pnpm install
   ```

2. **Configuration**
   ```bash
   cp .env.example .env
   # Update DATABASE_URL and BETTER_AUTH_SECRET in .env
   ```

3. **Database Setup**
   ```bash
   pnpm db:push
   pnpm db:generate
   ```

4. **Run Development Server**
   ```bash
   pnpm dev
   ```
   Access the dashboard at `http://localhost:7331`.

## Deployment

Deploy to production with a single click or use our standard CI/CD workflow.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmindtris%2Fmintax&env=DATABASE_URL,BETTER_AUTH_SECRET,NEXT_PUBLIC_APP_URL)

### Essential Environment Variables

| Variable | Description |
| :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Secret key for session encryption |
| `NEXT_PUBLIC_APP_URL` | The public URL of your deployment |
| `UPLOAD_PATH` | Path for local file storage (default: `./data/uploads`) |

## Contributing & Support

We welcome contributions from the community! Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting pull requests.

For enterprise inquiries, custom integrations, or dedicated support, contact us at [support@mindtris.com](mailto:support@mindtris.com).

---

<p align="center">
  Built with ❤️ by <strong><a href="https://mindtris.com">Mindtris</a></strong>
</p>

<p align="center">
  Licensed under the <a href="LICENSE">Apache License, Version 2.0</a>.
</p>
