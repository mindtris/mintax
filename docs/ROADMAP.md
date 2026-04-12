<p align="center">
  <a href="https://www.mindtris.com">
    <img src="../public/logo/logo.svg" width="80" alt="Mintax by Mindtris" />
  </a>
</p>

<h1 align="center">Roadmap</h1>

<p align="center">
  <sub><strong>Powered by Mindtris (Mintax)</strong></sub>
</p>

---

A living document of what we're working on, what's next, and what the community can pick up. Most roadmap items are open for contributors — open an issue to claim one before you start.

## Now (in progress)

- **Social media posting** — multi-platform posting with threads, comments, and scheduled replies
- **Unified schedule system** — deprecate RecurringTransaction in favor of Schedule(module="transaction"); route Reminder recurrence through Schedule; add inline "Make recurring" wizards per module; consolidate crons into /api/cron/schedules; add /schedules calendar view.
- **Email template customization** — move body copy out of React components into editable Setting rows; add preview + "send test to me"; build per-module EmailTemplate model with multiple variants; fill gaps for Estimates, Leads, Hire, team invites, and scheduled reports.

## Next (coming soon)

### Accounting
- **Recurring invoices** — auto-generate monthly/yearly invoices from templates
- **Expense reports** — group transactions into reports, submit for approval
- **Multi-currency improvements** — better FX rate tracking, historical rates
- **Chart of Accounts import/export** — CSV and QuickBooks format
- **Bank feed integration** — Plaid, Yodlee, Open Banking (EU)
- **Tax filing helpers** — GST, VAT, 1099-MISC report generators

### Engage
- **Content calendar view** — drag-drop post scheduling across accounts
- **Post analytics dashboard** — engagement trends, top posts, follower growth
- **More social providers** — Telegram, WhatsApp Business, Slack channels
- **AI content generation** — per-platform tone adjustment, image generation
- **Thread composer** — visual editor for Twitter/LinkedIn threads

### Hire
- **Resume parsing** — extract candidate data from PDF/DOCX automatically
- **Interview scheduler** — calendar integration for interviews
- **Candidate pipeline automation** — trigger emails on status changes
- **Job board integrations** — LinkedIn, Indeed, Naukri cross-posting
- **AI candidate matching** — rank candidates against job requirements

### Sales
- **Lead scoring** — automatic prioritization based on engagement
- **Deal pipeline Kanban** — drag-drop stages for leads
- **Quote/estimate approval flow** — client e-signature
- **CRM email sync** — two-way Gmail/Outlook integration

### People
- **Time off requests** — workflow for vacation, sick leave approval
- **Onboarding checklists** — templated flows for new hires
- **Document vault** — contracts, NDAs, policies with e-signature

### Platform
- **Dark mode** — full dark theme across the app
- **Accessibility audit** — WCAG 2.1 AA compliance
- **i18n support** — translations for Spanish, French, German, Portuguese, Hindi
- **Keyboard shortcuts** — command palette (⌘K), navigation
- **Mobile apps** — React Native for iOS/Android
- **API & webhooks** — public REST API, webhook subscriptions
- **MCP server** — AI agent integration for Claude Desktop
- **Workflow automation** — Zapier-style triggers and actions

## Later (exploratory)

- **AI assistant** — chat interface to operate Mintax via natural language
- **Custom reporting** — drag-drop report builder
- **White-label deployments** — branding customization for agencies
- **Marketplace** — third-party plugins and integrations
- **Audit log** — complete history of who did what, when
- **Teams & permissions** — granular role-based access control

## Completed

- Multi-tenant organizations
- Invoices, bills, estimates with line items
- **Invoice & Bill PDF generator** — server-side React-PDF rendering, auto-attached to records via the File model, full send-by-email flow for both invoices (to clients) and bills (to vendors) with SMTP + Resend attachments, template CRUD and accent color picker in Settings → Invoice
- **Unified file storage** — all modules (Accounts, Sales, Hire, Engage, Leads) go through the storage abstraction + File model with proper join tables
- **Consolidated settings** — single /settings page with ?tab= routing for all 14 sub-sections
- 28+ social media provider OAuth connections
- Schedule/recurring system (core engine)
- Dynamic invoice templates (default/classic/modern)
- Hire bench with Outlook submission
- Candidate pipeline with drag-drop Kanban
- People directory with role management
- Quicklinks, reminders, notifications
- Self-hosted mode with PIN protection
- Full-text search across modules
- Dashboard with analytics widgets

## How to contribute to the roadmap

Want to build something from this list?

1. **Pick an item** — most roadmap items are open for contributors
2. **Open an issue** saying "I'd like to work on X" so we can coordinate
3. **Read [CONTRIBUTING.md](./CONTRIBUTING.md)** for the workflow
4. **Ping the maintainers** if you need architectural guidance

Want to add something that isn't here?

1. **Open a [Discussion](https://github.com/mindtris/mintax/discussions/categories/ideas)** first — not every idea fits the vision, but many do
2. The maintainers review ideas weekly
3. If accepted, it gets added here and you can claim it

## Priorities

We use these criteria to rank roadmap items:

1. **Core product value** — does it make Mintax significantly more useful?
2. **Community demand** — are multiple users asking for it?
3. **Implementation cost** — how much work vs. how much impact?
4. **Strategic fit** — does it align with the all-in-one business platform vision?

Items that check all four boxes ship first.

## Not in scope

To keep Mintax focused, we intentionally won't build:

- **A general-purpose CRM** — we handle leads and customers, not full sales pipeline automation
- **A full ERP** — we're small-business focused, not mid-market
- **A project management tool** — use Linear, Asana, Jira
- **A help desk** — use Intercom, Zendesk, Crisp
- **A marketing automation platform** — use HubSpot, Brevo, ActiveCampaign

If you want these, we'd rather integrate with them than rebuild them.

---

<p align="center">
  <strong>Powered by <a href="https://www.mindtris.com">Mindtris</a> (Mintax)</strong><br/>
  <sub>Last updated: 2026-04-12 · Maintained by <a href="https://github.com/it-sainathgoud">@it-sainathgoud</a></sub>
</p>
