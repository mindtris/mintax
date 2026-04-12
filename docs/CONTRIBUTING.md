<p align="center">
  <a href="https://www.mindtris.com">
    <img src="../public/logo/logo.svg" width="80" alt="Mintax by Mindtris" />
  </a>
</p>

<h1 align="center">Contributing to Mintax</h1>

<p align="center">
  <sub><strong>Powered by Mindtris (Mintax)</strong></sub>
</p>

---

Thanks for your interest in making Mintax better. This guide covers how to contribute code, report bugs, suggest features, and engage with the community.

## Ways to contribute

You don't have to write code to help:

- **Report bugs** via [GitHub Issues](https://github.com/mindtris/mintax/issues/new?template=bug_report.md)
- **Suggest features** via [GitHub Discussions](https://github.com/mindtris/mintax/discussions)
- **Improve documentation** — typos, clarifications, examples
- **Answer questions** in Discussions or Discord
- **Share your experience** — blog posts, tweets, talks
- **Review pull requests** — your review helps maintainers ship faster
- **Translate the UI** — help us reach users in their language
- **Build integrations** — new social providers, email templates, LLM providers
- **Write tests** — help us reach better coverage

## Code of conduct

This project follows the [Contributor Covenant Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you agree to uphold it. Report unacceptable behavior to [support@mindtris.com](mailto:support@mindtris.com).

## Getting started

### Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL (Neon, Supabase, Docker, or local install)
- Git

### Setup

```bash
# 1. Fork the repo on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/mintax.git
cd mintax

# 2. Add the upstream remote
git remote add upstream https://github.com/mindtris/mintax.git

# 3. Install dependencies
pnpm install

# 4. Copy env template
cp .env.example .env
# Fill in at least DATABASE_URL and BETTER_AUTH_SECRET

# 5. Push schema
pnpm prisma db push --schema=lib/prisma/schema.prisma

# 6. Start the dev server
pnpm dev
```

Open `http://localhost:8080` — you should see the Mintax landing page.

## Development workflow

### Before you start

1. **Check existing issues/PRs** — avoid duplicating work
2. **Open an issue first** for anything beyond a small fix — it saves you time if the direction needs adjustment
3. **Comment on the issue** to let others know you're working on it

### Branching

```bash
# Always branch from the latest main
git checkout main
git pull upstream main
git checkout -b fix/short-description
```

Branch name conventions:

- `fix/...` — bug fixes
- `feat/...` — new features
- `docs/...` — documentation only
- `refactor/...` — code restructuring, no behavior change
- `chore/...` — tooling, deps, configs

### Code style

- **TypeScript** for everything — no plain JavaScript
- **Follow existing patterns** — check nearby files before introducing new ones
- **Components**: functional React with hooks, no class components
- **Naming**: `camelCase` for variables/functions, `PascalCase` for components/types
- **Imports**: absolute paths using `@/` alias, not relative `../../../`
- **No `console.log`** in committed code — use proper logging
- **No inline styles** when Tailwind classes work
- **Sheets**: full length (`h-[96vh]`), never `h-auto`
- **Buttons in pairs**: first is primary, second is `variant="secondary"`, never `outline` for cancel
- **Forms**: use `DatePicker` component, not native `type="date"`

Run the React doctor check before committing if you made frontend changes — it catches common issues.

### Commits

Write clear commit messages:

```
Good: "Fix invoice form not submitting line items"
Bad:  "update stuff"
```

Optional conventional commits are welcome but not required.

### Testing

Before pushing:

```bash
pnpm build          # must pass
pnpm prisma generate --schema=lib/prisma/schema.prisma
```

Manually verify your change in the browser:

- Does the feature work end-to-end?
- Does it break any existing flow?
- Does it render correctly on mobile?
- Does it match the existing visual patterns?

### Pull request

1. **Push to your fork**: `git push origin feat/your-feature`
2. **Open a PR** against `main`
3. **Describe what and why** — not just what changed, but why it matters
4. **Link related issues**: `Closes #123`
5. **Add screenshots/GIFs** for UI changes
6. **Respond to review comments** — we aim to review within 72 hours

**PR checklist:**

- [ ] Code builds without errors (`pnpm build`)
- [ ] Code follows project style
- [ ] UI changes include screenshots
- [ ] No unrelated changes bundled in
- [ ] Commit messages are descriptive
- [ ] Documentation updated if needed

## Project structure

```
mintax/
├── app/(app)/          # Authenticated app routes
├── app/api/            # API routes
├── components/         # React components
│   ├── ui/             # Primitives (Button, Input, etc.)
│   ├── accounts/       # Accounts module
│   ├── sales/          # Sales module
│   ├── hire/           # Hire module
│   ├── engage/         # Engage (social) module
│   ├── people/         # People module
│   └── settings/       # Settings components
├── lib/
│   ├── core/           # Auth, DB, config, encryption
│   ├── services/       # Business logic layer
│   ├── integrations/   # External APIs (social, email, etc.)
│   ├── prisma/         # Schema, migrations, client
│   └── schemas/        # Zod validation schemas
└── docs/               # Documentation
```

See [docs/AI.md](./AI.md) for the architectural philosophy.

## Contributing social providers

Adding a new social media provider to `/engage`:

1. Create `lib/integrations/social/{provider}.ts` implementing the `SocialProvider` interface
2. Register it in `lib/integrations/social/index.ts`
3. Add env vars for OAuth credentials (if applicable) to `lib/core/config.ts` and `.env.example`
4. Add the provider to `components/settings/connect-button.tsx`
5. Test the OAuth flow (or API key connection) end-to-end
6. Update [docs/OPENSOURCE.md](./OPENSOURCE.md) if it's a major platform

## Contributing email templates

Adding a new transactional email:

1. Create `components/emails/{name}-email.tsx` using the `EmailLayout` wrapper
2. Include "Powered by Mindtris (Mintax)" branding in the footer
3. Add a sending function to `lib/integrations/email.ts`
4. Wire it into the module that triggers the email
5. Add subject/footer customization to `lib/schemas/settings.ts` and the email templates settings form

## Feature requests

Have an idea? Open a [Discussion](https://github.com/mindtris/mintax/discussions/categories/ideas) with:

- **The problem** you're trying to solve
- **Your proposed solution**
- **Alternatives** you've considered
- **Who benefits** from this feature

The core team reviews discussions weekly. If the community and maintainers agree, we'll convert it to an issue and find someone to implement it.

## Reporting security issues

Do **not** open a public issue for security vulnerabilities. Email [security@mindtris.com](mailto:security@mindtris.com) with:

- A description of the issue
- Steps to reproduce
- Your contact info

We'll respond within 48 hours and coordinate a fix + disclosure.

## Recognition

All contributors are credited in [docs/OPENSOURCE.md](./OPENSOURCE.md) via the [contrib.rocks](https://contrib.rocks) widget. Significant contributions get a shoutout in release notes.

## Questions?

- **GitHub Discussions** — for general questions and ideas
- **Issues** — for bugs and feature requests
- **Email** — [support@mindtris.com](mailto:support@mindtris.com) for anything else

Thanks for helping build Mintax in the open.

---

<p align="center">
  <strong>Powered by <a href="https://www.mindtris.com">Mindtris</a> (Mintax)</strong><br/>
  <sub>Made with care, shared with everyone.</sub>
</p>
