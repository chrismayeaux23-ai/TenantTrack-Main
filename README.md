# TenantTrack - Reduce vendor no-shows and maintenance delays without chasing anyone

**The smart maintenance platform for landlords.**

TenantTrack is a mobile-first SaaS for independent landlords and small property managers who are tired of chasing vendors, losing maintenance requests in text threads, and rebuilding the same paper trail every month. Tenants scan a QR code to report an issue, the platform recommends or auto-assigns the best vendor based on a 0–100 trust score, and vendors respond through a secure magic link — no app, no account, no chaos.

- **Live site:** [tenant-track.com](https://tenant-track.com)
- **Replit-hosted:** [tenant-management-hub.replit.app](https://tenant-management-hub.replit.app)
- **Design language:** dark navy background, neon orange accents, Space Grotesk headings + Inter body, mobile-first, always dark mode.
- **Demo Login:** Email: tenanttrackapp@gmail.com Pass: Jetta1989$

---

## The problem

Maintenance coordination is the highest-friction, most time-consuming part of property management:

- Vendors don't respond and there's no paper trail.
- Jobs get lost in a chain of texts and voicemails.
- Scheduling is inconsistent and double-bookings happen.
- Follow-ups eat hours every week.
- When a dispute comes up, there's no system of record.
- No-shows

## The solution

TenantTrack replaces all of that with a structured, automated workflow:

1. A tenant scans a QR code and submits a request in under a minute.
2. The landlord is notified instantly with full details and photos.
3. The best vendor is recommended (or auto-assigned) using a trust-based scoring algorithm.
4. The vendor accepts, schedules, and completes the job through a secure magic link.
5. Everyone stays in sync via automated email notifications.
6. If a vendor doesn't respond in time, the system escalates and suggests the next best vendor automatically.

## The Why

Most tools focus on logging requests.
The real problem is what happens after—vendor coordination.
TenantTrack is built specifically to fix that gap.

A tenant reports a leak → landlord assigns vendor → vendor accepts via link → updates status → job completed.

---

## Features

### Tenant experience
- One QR code per property, linking to a public maintenance request form (no login).
- Bilingual interface (English + Spanish).
- Photo uploads (up to 3 images per request).
- Tracking page accessed via a unique 8-character code.
- Two-way messaging with the landlord per request — no tenant account required.
- Print-ready property flyer for posting in common areas.

### Landlord workspace
- Properties, units, tenants, and a directory built automatically from submitted requests.
- Dashboard with real-time analytics, status badges, and interactive stat cards that filter the request list.
- Internal landlord-only notes per request.
- Activity log with a timestamped audit trail on every request.
- Repair cost tracking per request (description, amount, vendor, invoice number, materials) with CSV export.
- Recurring maintenance scheduling (weekly, biweekly, monthly, quarterly, biannually, annually) with auto-calculated next-due dates and overdue alerts.

### Vendor network
- Private network of contractors with preferred-vendor flagging, contact info, license/insurance tracking, and internal ratings.
- Trust score (0–100) per vendor, derived from review quality, completion rate, response time, and no-show history.
- Vendor reviews per job (quality, speed, communication, price, overall).
- Detailed vendor profiles with job history and performance stats.
- **CSV / Excel import** for bulk-loading an existing vendor list.
- **Phonebook-photo OCR import** — landlords snap photos of a paper Rolodex or address book and the platform extracts name, phone, trade, and notes via OpenAI vision, then drops the rows into the same review-and-confirm flow used for CSV.
- Every vendor is tagged by source (`manual`, `csv_import`, `phonebook_photo`) and surfaced on the vendor card.

### Dispatch & scheduling
- **Auto-Dispatch Engine** with three modes — Manual, Recommend, Auto-Assign — and a transparent scoring breakdown (trade match, urgency, service area, trust score, workload, no-show penalties).
- **Dispatch Board (Kanban)** with columns for Needs Dispatch → Awaiting Response → Scheduled → In Progress → Waiting on Parts → Completed. Drag-and-drop, urgency sorting, and SLA-overdue indicators on every card.
- **Scheduling Calendar** with week, day, and list views, full filtering (vendor, property, trade, status, urgency), conflict detection, reschedule/unschedule, and one-click acceptance of vendor-proposed times.
- **SLA Escalation Engine** — a background process that checks vendor response deadlines every five minutes, auto-escalates non-responses, suggests the next best vendor, sends 24-hour reminder emails before scheduled jobs, and alerts landlords about unassigned emergencies.
- SLA & Dispatch panel on each request with response-deadline countdown, escalation history, suggested reassignment, and the full notification log.

### Vendor magic-link portal
- Vendors receive a secure one-click email link — no login, no account.
- Accept, decline, or propose a new time.
- Mark status: en route, started, completed.
- Add job notes, cost details, invoice numbers, and materials used.
- Links expire after 7 days; landlords can revoke or regenerate at any time.

### Communications
Automated transactional email via Resend for:
- New request alerts to landlords
- Vendor dispatch notifications
- Vendor responses (accept, decline, propose-time, en-route, complete)
- 24-hour reminder to vendors before scheduled jobs
- Tenant updates when a vendor is scheduled
- SLA violation alerts to landlords

### Plans & billing
- Stripe-backed subscriptions with auto-seeded products on startup, webhook processing, and a customer billing portal.
- Plan-based feature gating across property limits, staff assignment, vendor import (Growth + Pro), analytics, and more.
- Public `/terms` and `/privacy` pages.
- Demo account with pre-seeded data for showing the product without dirtying real data.

### Authentication
- Email + password with email verification (6-digit code via Resend, 15-minute expiry).
- Google OAuth.
- Forgot-password flow (secure token link via Resend, 1-hour expiry).
- Unverified accounts are blocked at signin until verified.

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, TypeScript, Vite, Tailwind CSS, Shadcn UI, Wouter (routing), TanStack Query (server state) |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL with Drizzle ORM |
| Auth | Passport.js (email/password + Google OAuth), Bcrypt for hashing |
| Payments | Stripe (subscriptions, checkout, billing portal), `stripe-replit-sync` |
| Email | Resend (transactional notifications) |
| File storage | Replit Object Storage (tenant photo uploads) |
| AI | OpenAI vision (GPT-4o) for phonebook-photo OCR extraction |

---

## Getting started

```bash
git clone https://github.com/your-username/tenanttrack.git
cd tenanttrack
npm install
npm run db:push     # sync the Drizzle schema to your PostgreSQL instance
npm run dev         # starts Express + Vite on the same port
```

Build and run a production bundle:

```bash
npm run build
node dist/index.cjs
```

### Environment variables

Required:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Express session signing secret |

Email (Resend):

| Variable | Purpose |
|----------|---------|
| `RESEND_API_KEY` | API key for sending transactional email |
| `EMAIL_FROM` | Sender address used in notifications (optional) |

Payments (Stripe):

| Variable | Purpose |
|----------|---------|
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |

Google OAuth:

| Variable | Purpose |
|----------|---------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |

Object storage (provided automatically when running on Replit):

| Variable | Purpose |
|----------|---------|
| `DEFAULT_OBJECT_STORAGE_BUCKET_ID` | Bucket id |
| `PUBLIC_OBJECT_SEARCH_PATHS` | Public asset search paths |
| `PRIVATE_OBJECT_DIR` | Directory for private uploads (tenant photos) |

AI (OpenAI vision, used by phonebook-photo OCR import):

| Variable | Purpose |
|----------|---------|
| `AI_INTEGRATIONS_OPENAI_API_KEY` | OpenAI API key |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | OpenAI base URL (optional, defaults to upstream) |

Optional:

| Variable | Purpose |
|----------|---------|
| `APP_URL` | Public application URL (defaults to the Replit-hosted domain) |

---

## Subscription plans

| Plan | Price | Best for |
|------|:-----:|----------|
| Starter | $29/mo | Small landlords (1–5 units) |
| Growth | $59/mo | Growing portfolios (6–25 units) |
| Pro | $99/mo | Professional managers (25+ units) |

All plans include a 14-day free trial. No credit card required to start.

---

## Project status

TenantTrack is live and used in production. Core dispatch, scheduling, vendor coordination, magic-link workflow, SLA escalation, vendor import (CSV + phonebook photo), and Stripe billing are all shipped.

---

## Contact

- Email: chrismayox@gmail.com
- Phone: (503) 380-6482
- Website: [tenant-track.com](https://tenant-track.com)

---

## License

MIT — see [License.md](./License.md).

## Author

Christopher Mayeaux
