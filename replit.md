# TenantTrack

## Overview
TenantTrack is a mobile-first SaaS web application designed for landlords to efficiently manage maintenance requests. It utilizes QR codes for tenant submissions and provides a comprehensive system for vendor management, including trust scoring, dispatch coordination, and detailed analytics. The platform aims to streamline property maintenance, enhance communication between landlords, tenants, and vendors, and improve the overall efficiency and accountability of repair processes. Key capabilities include property management, tenant request tracking, staff and vendor assignment, cost logging, recurring maintenance scheduling, and subscription billing.

## User Preferences
The user prefers a dark mode theme with a dark navy and neon orange color scheme (matching the shield logo). Headings should use the 'Space Grotesk' font, and body text should use 'Inter'. Active navigation items in the sidebar should have an orange left border, and the sidebar itself should have a deep near-black background. Semantic colors should be used for status indicators (e.g., green for "Completed/Excellent", orange for "High urgency" and "In Progress") and CTAs/UI accents (orange/primary).

## System Architecture
The application follows a mobile-first design philosophy.
- **Frontend**: Built with React, Tailwind CSS, and Shadcn UI, utilizing Vite for tooling.
- **Backend**: Implemented using Express.js.
- **Database**: PostgreSQL, managed with Drizzle ORM.
- **Authentication**: Supports email/password login and Google OAuth, both managed via Passport sessions. User data includes `passwordHash` and is generated with `crypto.randomUUID()` on signup. Includes email verification on signup (6-digit code via Resend, 15-min expiry) and forgot password flow (secure token link via Resend, 1-hour expiry). Unverified accounts are blocked at signin until verified. DB tables: `password_reset_tokens`, `email_verification_codes`. Users table has `email_verified` boolean.
- **Storage**: Replit Object Storage is used for tenant photo uploads.
- **Domain**: tenanttrack.xyz (custom domain), tenant-management-hub.replit.app (Replit domain)
- **Logo**: TenantTrack circular logo at `@assets/tenanttrack-final-logo.png` (circular badge with TT letters, house, key, clipboard). Wide version at `@assets/tenanttrack-wide-logo.png`.
- **Background images**: `@assets/I_need_a_navy_blue,_white,_and_grey_background_image_of_geo-me_1774148774611.jpg` (geometric), `@assets/I_need_a_navy_blue,_white,_and_grey_background_image_of_rental_1774148774612.jpg` (buildings), `@assets/Untitled_design_(1)_1774148774613.jpg` (building icon)
- **UI/UX**:
    - **Color Scheme**: Dark navy background (`--background: 224 50% 5%`) with neon orange primary (`--primary: 18 100% 50%`).
    - **Typography**: Space Grotesk for headings, Inter for body text.
    - **Layout**: Left sidebar navigation with active indicator, mobile-first responsiveness including a bottom navigation bar.
    - **Theming**: Always dark mode; no light mode toggle.
    - **Logo**: TenantTrack shield logo with T letter, buildings, key, and checklist — dark navy/silver/orange palette.
- **Core Features**:
    - QR code generation for properties, linking to public tenant maintenance request forms.
    - Tenant photo uploads for maintenance requests (up to 3 photos).
    - Dashboard with analytics, status badges, and interactive stat cards for filtering requests.
    - Internal notes/comments system for landlords per request.
    - Tenant directory with contact information.
    - Billing page with Stripe portal integration for subscriptions.
    - Printable flyer template for properties.
    - Maintenance staff management, including assignment of requests.
    - Tenant tracking page accessible via unique 8-character codes, with bilingual support (English/Spanish).
    - Two-way messaging between tenants and landlords per request, without tenant authentication.
    - Repair cost tracking per request (description, amount, vendor), with CSV export functionality.
    - Recurring maintenance scheduling with auto-calculation of next due dates.
    - Vendor management: private network of contractors with preferred flagging, contact info, license/insurance tracking, and internal ratings.
    - Vendor assignment to maintenance requests with priority setting.
    - Vendor reviews based on job performance (quality, speed, communication, price, overall).
    - Dedicated detail pages for requests and vendors, featuring timelines, activity logs, and performance statistics.
    - Plan-based feature gating (e.g., property limits, staff assignment).
    - Public `/terms` and `/privacy` pages.
    - Demo account with pre-seeded data for demonstration purposes.
    - **Auto-Dispatch Engine**: Scoring algorithm (trade match, urgency, service area, trust score, workload, no-show penalties) that recommends or auto-assigns the best vendor for a request. Supports manual, recommend, and auto-assign dispatch modes.
    - **Vendor Response Workflow**: Magic link system with 7-day expiration, token validation, and vendor notes. Vendors receive a unique portal URL to accept, decline, or propose new times. Portal supports en-route tracking, job completion with cost/invoice details, and vendor notes. Landlords see link status (active/expired/used), can revoke/regenerate links, and approve proposed times directly from request detail.
    - **Dispatch Board (Kanban)**: Visual board with columns for needs-dispatch, awaiting-response, scheduled, in-progress, waiting-on-parts, and completed. Supports drag-and-drop between columns with quick action buttons (auto-dispatch, schedule, open detail). Cards show SLA overdue state, urgency sorting, and vendor response status.
    - **Scheduling Calendar**: Week, day, and list views with vendor/property/trade/status/urgency filters. Shows scheduled jobs on a calendar grid, lists unscheduled jobs below. Includes scheduling modal with conflict detection, reschedule/unschedule actions, and proposed-time acceptance from vendors.
    - **SLA Escalation Engine**: Background process (5-min interval) that monitors vendor response deadlines, auto-escalates no-responses, sends 24-hour reminder emails to vendors for upcoming scheduled jobs, auto-suggests next best vendor on SLA violations, and alerts landlords about unassigned emergency requests.
    - **Automated Communications**: Email notifications via Resend for vendor dispatch, vendor reminders (24h before scheduled job), tenant updates when vendor is scheduled, landlord alerts on vendor accept/decline/complete/en-route/proposed-time, and SLA violation alerts. Request status auto-syncs on vendor assignment and dispatch actions.
    - **SLA Visibility**: Request detail page shows SLA & Dispatch panel with response deadline countdown, dispatch mode, escalation history with suggested vendor reassignment, and notification log.
- **API Endpoints**: Comprehensive set of RESTful APIs for managing properties, requests, tenants, staff, vendors, costs, recurring tasks, messages, and analytics.
- **Stripe Integration**: Auto-seeding of subscription products on startup, webhook processing, and customer/subscription management. Live payments run on Stripe account `acct_1T5Ss8PJUEiInvci` (TenantTrack_DB, charges enabled). API keys are read from `STRIPE_LIVE_SECRET_KEY` / `STRIPE_LIVE_PUBLISHABLE_KEY` secrets when present (with the Replit Stripe connector as a fallback). The managed webhook is auto-created on whatever URL `REPLIT_DOMAINS` resolves to at startup, and the signing secret is stored by `stripe-replit-sync` in the local Postgres `stripe` schema.
- **Email Service**: Resend-based email notifications for new requests, status updates, and staff assignments.
- **File Structure**: Organized with clear separation for shared schemas, server-side logic, client-side components, and integration specific files (e.g., `replit_integrations`).
- **Deployment**: Configured for autoscale deployment with `npm run build` and `node dist/index.cjs` (matches the `start` script in `package.json`).

## External Dependencies
- **Stripe**: For subscription management, payments, checkout, and billing portal. Uses `stripe-replit-sync`.
- **Resend**: For sending email notifications (new requests, status updates, staff assignments). Requires `RESEND_API_KEY`.
- **PostgreSQL**: Primary database.
- **Drizzle ORM**: Object-Relational Mapper for database interaction.
- **React**: Frontend library.
- **Tailwind CSS**: Utility-first CSS framework.
- **Shadcn UI**: UI component library.
- **Express.js**: Backend web framework.
- **Vite**: Frontend build tool.
- **Passport.js**: Authentication middleware.
- **Bcrypt**: For password hashing.
- **Replit Object Storage**: For storing tenant uploaded images.
- **Google OAuth**: For Google sign-in (requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET).
