# TenantTrack

**The smart maintenance platform for landlords.**

TenantTrack is a mobile-first SaaS application that streamlines property maintenance from request to completion. Tenants scan a QR code to report issues, landlords dispatch trusted vendors with one click, and vendors respond through secure magic links — no apps, no accounts, no chaos.

**Website:** [tenant-track.com](https://tenant-track.com)

**Design:** Dark navy UI with royal blue accents. Mobile-first, always dark mode.

---

## The Problem

Maintenance coordination is one of the most frustrating parts of property management:

- Vendors don't respond — and there's no paper trail
- Jobs get lost in a chain of texts and voicemails
- Scheduling is inconsistent and double-bookings happen
- Follow-ups waste hours every week
- No system of record when disputes arise

## Why This Matters

Maintenance coordination is one of the highest-friction, most time-consuming tasks for landlords.

TenantTrack reduces:
- Missed jobs
- Vendor delays
- Manual coordination
- Operational overhead

**Result:** Faster repairs, better vendor decisions, and less time spent managing maintenance.

## The Solution

TenantTrack replaces the chaos with a structured, automated workflow:

1. A tenant scans a QR code and submits a maintenance request
2. You're notified instantly with full details and photos
3. The best vendor is recommended (or auto-assigned) based on trust scores
4. The vendor receives a secure magic link — no account needed
5. The vendor accepts, schedules, and completes the job
6. Everyone stays in sync with automated email notifications
7. If a vendor doesn't respond, the system escalates automatically

---

## Core Features

### QR-Powered Tenant Requests
- Every property gets a unique, scannable QR code
- Tenants submit requests in under 60 seconds — no app download required
- Supports photo uploads (up to 3), urgency levels, and issue categories
- Bilingual interface (English and Spanish)
- Tenants receive a tracking code to check request status anytime
- Print-ready flyer generation for posting in common areas

### Smart Vendor Dispatch
- **Three dispatch modes:** Manual, Recommend, or Auto-Assign
- Scoring algorithm considers trade match, trust score, emergency availability, workload, service area, and no-show history
- Full scoring breakdown shows exactly why each vendor was recommended
- Preferred vendor prioritization with fallback suggestions

### Vendor Magic-Link Portal
- Vendors receive a secure one-click link via email — no login or account required
- Accept, decline, or propose a new time
- Mark status updates: en route, started, completed
- Add job notes, cost details, invoice numbers, and materials used
- Links expire after 7 days; landlords can revoke or regenerate anytime

### Trust Scores (0–100)
- Every vendor gets a performance score based on reviews, completion rate, response time, and no-show history
- Scores feed directly into the dispatch algorithm
- Higher-scoring vendors get prioritized automatically
- Detailed vendor profiles with job history, performance stats, and review breakdowns

### Scheduling Calendar
- Week, day, and list views with full filtering (vendor, property, trade, status, urgency)
- Automatic conflict detection prevents double-booking
- Reschedule or unschedule jobs with one click
- Accept vendor-proposed times directly from the calendar

### Dispatch Board (Kanban)
- Visual pipeline: Needs Dispatch → Awaiting Response → Scheduled → In Progress → Completed
- Drag-and-drop between columns
- Quick action buttons for auto-dispatch, scheduling, and detail views
- Urgency sorting and SLA overdue indicators on every card

### SLA Engine & Escalation
- Background monitoring checks vendor response deadlines every 5 minutes
- Auto-escalates non-responsive vendors and suggests the next best alternative
- Sends 24-hour reminder emails to vendors before scheduled jobs
- Alerts landlords about unassigned emergency requests
- Full escalation history visible on each request

### Automated Email Notifications
- New request alerts to landlords
- Vendor dispatch confirmations
- Vendor response notifications (accept, decline, propose time, en route, complete)
- Tenant updates when a vendor is scheduled
- 24-hour vendor reminders before scheduled jobs
- SLA violation alerts

### Cost Tracking & Reporting
- Log repair costs per request with vendor details, invoice numbers, and materials
- Export full cost history to CSV
- Analytics dashboard with spending trends, response times, and vendor performance charts

### Recurring Maintenance
- Schedule preventive tasks (HVAC filters, smoke detectors, pest control, etc.)
- Configurable frequency: weekly, biweekly, monthly, quarterly, biannually, annually
- Overdue task alerts ensure nothing slips through the cracks

### Additional Features
- **Dashboard** with real-time analytics, status badges, and interactive filtering
- **Tenant directory** auto-built from submitted requests
- **Staff management** with request assignment capabilities
- **Internal notes** system for landlord-only comments per request
- **Two-way messaging** between tenants and landlords (no tenant login required)
- **Activity logs** with full timestamped audit trail on every request
- **Plan-based feature gating** (property limits, staff assignment, analytics access)
- **Demo mode** with pre-seeded data for demonstrations

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React, TypeScript, Vite, Tailwind CSS, Shadcn UI |
| **Backend** | Node.js, Express.js, TypeScript |
| **Database** | PostgreSQL, Drizzle ORM |
| **Authentication** | Passport.js (email/password + Google OAuth) |
| **Payments** | Stripe (subscriptions, checkout, billing portal) |
| **Email** | Resend (transactional notifications) |
| **Storage** | Replit Object Storage (tenant photo uploads) |
| **Routing** | Wouter (client-side) |
| **State** | TanStack Query (server state management) |

---

## Environment Variables

### Required

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Express session secret |

### Email (Resend)

| Variable | Description |
|----------|-------------|
| `RESEND_API_KEY` | Resend API key for sending emails |

### Payments (Stripe)

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |

### Authentication (Google OAuth)

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |

### Optional

| Variable | Description |
|----------|-------------|
| `EMAIL_FROM` | Sender email address for notifications |
| `APP_URL` | Public application URL (defaults to Replit domain) |

---

## Getting Started

```bash
git clone https://github.com/your-username/tenanttrack.git
cd tenanttrack
npm install
npm run dev
```

The development server starts Express (backend) and Vite (frontend) on the same port.

---

## Subscription Plans

| Plan | Price | Best For |
|------|:-----:|----------|
| **Starter** | $29/mo | Small landlords (1–5 units) |
| **Growth** | $59/mo | Growing portfolios (6–25 units) |
| **Pro** | $99/mo | Professional managers (25+ units) |

All plans include a 14-day free trial. No credit card required to start.

---

## Key Differentiator

Unlike traditional property management tools, TenantTrack focuses specifically on:

- Vendor performance tracking tied to real jobs
- Automated dispatch and escalation workflows
- Vendor trust scoring based on actual outcomes

This creates a system that improves decision-making over time — not just task tracking.

---

## Roadmap

- Advanced vendor trust scoring
- Vendor availability tracking
- Automated scheduling optimization
- Mobile-friendly vendor workflows
- Deeper analytics and reporting

---

## Screenshots

*(Dashboard, dispatch board, and vendor view coming soon)*

---

## Project Status

TenantTrack is live and actively used in production. Core dispatch, scheduling, vendor coordination, and billing workflows are fully implemented.

---

## Contact

- **Email:** support@tenant-track.com
- **Phone:** (503) 380-6482
- **Website:** [tenant-track.com](https://tenant-track.com)

---

## License

MIT License

## Author

Christopher Mayeaux
