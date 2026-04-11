<p align="center">
  <img src="public/logo/logo.svg" width="480" alt="mintax" />
</p>

<h1 align="center">mintax</h1>

<p align="center">
  <strong>Multi-tenant Bookkeeping and Business Operating System for Modern Enterprises</strong>
</p>

<p align="center">
  <a href="#features"><img src="https://img.shields.io/badge/AI_Powered-c96442?style=flat-square" alt="AI Powered" /></a>
  <a href="#features"><img src="https://img.shields.io/badge/Multi_Tenant-141413?style=flat-square" alt="Multi Tenant" /></a>
  <a href="#features"><img src="https://img.shields.io/badge/Self_Hosted-c96442?style=flat-square" alt="Self Hosted" /></a>
  <a href="#tech-stack"><img src="https://img.shields.io/badge/Next.js_15-141413?style=flat-square" alt="Next.js 15" /></a>
  <a href="#tech-stack"><img src="https://img.shields.io/badge/PostgreSQL-c96442?style=flat-square" alt="PostgreSQL" /></a>
</p>

<p align="center">
  A comprehensive platform designed to manage financial operations, sales, recruitment, and digital engagement across multiple businesses and entities with enterprise grade security, scalability, and AI capabilities that run on your own infrastructure.
</p>

---

## Features

**Accounts**  
Complete financial management with transaction processing, intelligent bank reconciliation, accounts payable, financial reporting, and native support for 170+ currencies.

**Sales**  
Full sales cycle management including invoicing, estimates, customer relationship management, product and service catalogs.

**Hire**  
End-to-end talent acquisition module featuring job posting management, candidate pipeline tracking, screening workflows, and AI assisted job description generation.

**Engage**  
Social media management suite with content planning, multi-channel scheduling, and AI powered content creation.

**AI Engine**  
Highly configurable AI assistance layer supporting multiple LLM providers and local models through Ollama, with module specific prompt engineering.

**Administration**  
Centralized system configuration with advanced management of taxes, categories, projects, custom fields, and multi-currency settings through a powerful unified interface.

## Tech Stack

| Layer              | Technology                                      |
|--------------------|-------------------------------------------------|
| Framework          | Next.js 15, React 19, TypeScript               |
| Styling            | Tailwind CSS, Radix UI                          |
| Database           | PostgreSQL with Prisma ORM                      |
| AI Framework       | LangChain                                       |
| Authentication     | better-auth                                     |
| Payments           | Stripe                                          |
| Email              | Resend                                          |
| Storage            | Local or S3-compatible (R2, MinIO)             |

## Quick Start

```bash
git clone <repository-url>
cd mintax

cp .env.example .env

pnpm install
pnpm dev
