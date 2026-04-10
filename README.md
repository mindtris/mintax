# Mintax
Multi-tenant bookkeeping and accounting platform for managing expenses, invoices, bank statements, and financial records across multiple companies and personal accounts.

## Features

- **Multi-Company Support** — Manage bookkeeping for multiple businesses and personal accounts from a single platform
- **AI-Powered Document Processing** — Upload receipts, invoices, and bank statements; AI extracts and categorizes data automatically
- **Multi-Currency** — 170+ world currencies and 14 cryptocurrencies with historical exchange rate conversion
- **Transaction Management** — Full CRUD with filtering, categories, projects, and custom fields
- **Invoice Generation** — Create and manage professional invoices with PDF export
- **Data Import/Export** — CSV import/export, full backup/restore with ZIP archives
- **Customizable AI Prompts** — Configure LLM prompts for fields, categories, and projects
- **Multiple LLM Providers** — OpenAI, Google Gemini, Mistral, and OpenAI-compatible (Ollama, LM Studio)
- **Self-Hosted** — Full control over your data with Docker deployment

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, Radix UI
- **Backend**: Next.js Server Actions, Prisma ORM
- **Database**: PostgreSQL 17
- **AI**: LangChain (multi-provider)
- **Auth**: better-auth (email OTP)
- **Payments**: Stripe (optional)
- **Email**: Resend (optional)
- **Monitoring**: Sentry (optional)

## Quick Start

### Docker (Recommended)

```bash
# Clone the repository
git clone <your-repo-url> mintax
cd mintax

# Copy environment config
cp .env.example .env
# Edit .env with your settings (API keys, etc.)

# Start with Docker Compose
docker compose up -d
```

The app will be available at `http://localhost:7331`.

### Local Development

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Run database migrations
npx prisma migrate deploy

# Start dev server
npm run dev
```

## Configuration

All configuration is done via environment variables. See [.env.example](.env.example) for available options.

Key settings:
- `DATABASE_URL` — PostgreSQL connection string
- `BETTER_AUTH_SECRET` — Auth secret (min 16 characters)
- `OPENAI_API_KEY` / `GOOGLE_API_KEY` / `MISTRAL_API_KEY` — AI provider keys (at least one required)

## License

MIT License — Based on [TaxHacker](https://github.com/vas3k/TaxHacker) by Vasily Zubarev.
