<p align="center">
  <a href="https://www.mindtris.com">
    <img src="../public/logo/logo.svg" width="80" alt="Mintax by Mindtris" />
  </a>
</p>

<h1 align="center">Open Source</h1>

<p align="center">
  <sub><strong>Powered by Mindtris (Mintax)</strong></sub>
</p>

---

Mintax is open source and free to self-host. Built by [Mindtris](https://www.mindtris.com).

## Why open source?

We believe the tools businesses use to run their operations should be transparent, modifiable, and owned by the people using them. Mintax is our bet on that.

- **Own your data.** Self-host on your own infrastructure. No vendor lock-in.
- **Audit the code.** Every line is public. Review it, fork it, adapt it.
- **Extend anything.** Add your own modules, providers, or integrations.
- **Pay for value, not access.** The code is free. Optional managed hosting and enterprise support are paid.

## What's included

The full platform — the same code Mindtris runs in production.

| Module | What it does |
|--------|--------------|
| **Accounting** | Transactions, bills, invoices, estimates, reconciliation |
| **Sales** | Leads, customers, invoices, estimates |
| **Hire** | Job postings, candidates, pipeline, bench, career portals |
| **Engage** | Multi-platform social posting across 28+ providers (X, LinkedIn, Reddit, YouTube, TikTok, Threads, Bluesky, Mastodon, etc.) |
| **People** | Team directory, quicklinks, reminders |
| **Apps** | Invoice PDF generator, reminders, Outlook integration |
| **Settings** | Email templates, invoice templates, schedules, LLM providers, social accounts |

## License

**AGPL-3.0** — You can use, modify, and distribute Mintax freely. If you host a modified version as a network service, you must share your changes under the same license.

For commercial licensing (proprietary deployments, white-labeling, embedded use), contact [support@mindtris.com](mailto:support@mindtris.com).

## Get the code

Repository: [github.com/mindtris/mintax](https://github.com/mindtris/mintax)

```bash
git clone https://github.com/mindtris/mintax.git
cd mintax
cp .env.example .env     # fill in your values
pnpm install
pnpm prisma db push --schema=lib/prisma/schema.prisma
pnpm dev
```

Full setup instructions are in the repo [README](https://github.com/mindtris/mintax#readme).

## Requirements

- Node.js 18+
- PostgreSQL (Neon, Supabase, or self-hosted)
- pnpm

## Contributing

We welcome contributions. See [CONTRIBUTING.md](../CONTRIBUTING.md) for the full guide.

**Quick start:**

1. Open an issue to discuss significant changes
2. Fork the repo and create a feature branch
3. Keep commits focused and descriptive
4. Match the existing code style
5. Add tests where appropriate

Run `pnpm dev` locally to verify changes before submitting.

## Contributors

Mintax is maintained by [Mindtris](https://www.mindtris.com) and built with the help of contributors from around the world.

**Core team:**

- [@it-sainathgoud](https://github.com/it-sainathgoud) — Founder & Maintainer

**Contributors:**

<a href="https://github.com/mindtris/mintax/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=mindtris/mintax" alt="Mintax contributors" />
</a>

Want to see your name here? [Check out the good first issues](https://github.com/mindtris/mintax/labels/good%20first%20issue) to get started.

## Support

- **Community**: [GitHub Discussions](https://github.com/mindtris/mintax/discussions)
- **Issues**: [GitHub Issues](https://github.com/mindtris/mintax/issues)
- **Commercial**: [support@mindtris.com](mailto:support@mindtris.com)

## Built with Mintax

Companies and projects running Mintax in production:

| Organization | Use case |
|--------------|----------|
| [Mindtris](https://www.mindtris.com) | Full business operations stack |

*Using Mintax? [Open a PR](https://github.com/mindtris/mintax/pulls) to add your organization here.*

## Credits

Mintax is built on the shoulders of incredible open source projects:

- [Next.js](https://nextjs.org) — React framework
- [Prisma](https://prisma.io) — database ORM
- [Better Auth](https://better-auth.com) — authentication
- [shadcn/ui](https://ui.shadcn.com) — component primitives
- [Tailwind CSS](https://tailwindcss.com) — styling
- [Radix UI](https://radix-ui.com) — accessible components
- [Lucide](https://lucide.dev) — icons
- [Sonner](https://sonner.emilkowal.ski) — toast notifications
- [react-day-picker](https://react-day-picker.js.org) — date picker
- [react-pdf](https://react-pdf.org) — PDF rendering

And dozens more. Thank you to everyone building in the open.

---

<p align="center">
  <strong>Powered by <a href="https://www.mindtris.com">Mindtris</a> (Mintax)</strong><br/>
  <sub>Made with care, shared with everyone.</sub>
</p>
