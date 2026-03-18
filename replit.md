# TenantTrack

A mobile-first SaaS web app where landlords manage maintenance requests via QR codes.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI (Vite)
- **Backend**: Express.js on port 5000
- **Database**: PostgreSQL via Drizzle ORM
- **Auth**: Email/password login (primary) + Replit Auth (legacy/owner) — both use passport sessions
- **Storage**: Replit Object Storage (tenant photo uploads)
- **Payments**: Stripe (subscriptions with 14-day free trial)
- **Email**: Resend (RESEND_API_KEY env var) — notifications for new requests, status updates, staff assignments

## Key Features
- Landlords sign up, add properties (each generating a unique QR code)
- Tenants scan QR code to access public form at `/report/:propertyId` (no account needed)
- Tenants can upload up to 3 photos per maintenance request
- Dashboard with analytics stats (total, new, in-progress, completed) and status badges
- Request notes/comments system for landlords to add internal notes per request
- Tenant Directory page showing all tenants who've submitted requests with contact info
- Billing page with Stripe portal integration for payment methods, invoices, plan management
- Printable flyer template at `/flyer/:propertyId` for landlords to post on tenant doors
- Stripe subscription billing with 3 tiers: Starter ($29), Growth ($59), Pro ($99)
- Pricing page with hardcoded plan info (always displays) + Stripe checkout when products synced
- Auto-seeding of Stripe products on startup if they don't exist in the connected Stripe account
- Maintenance staff management: landlords add/remove team members, assign requests to staff
- Tenant tracking: each request gets a unique 8-char tracking code; tenants check status at `/track/:code`
- Bilingual tenant UI: report form (`/report/:id`) and tracking page (`/track/:code`) support English/Spanish toggle; translations in `client/src/lib/i18n.ts`
- Tenant-landlord messaging: two-way messages per request; landlord sends from dashboard, tenant from tracking page via tracking code; no tenant auth needed; auto-refreshes every 10-15s
- Repair cost tracking: log costs per request (description, amount, vendor), view/export reports by date/property as CSV
- Recurring maintenance scheduling: create tasks (HVAC, smoke detectors, etc.) with frequency, auto-calculates next due date on completion, overdue highlighting
- Vendor Management: landlords maintain a private network of contractors (vendors) per trade category (Plumbing, Electrical, HVAC, etc.), with preferred vendor flagging, contact info, license/insurance tracking, private notes, and ratings
- Vendor Assignment: assign a vendor to any maintenance request from the dashboard expanded card, set priority (Normal/High/Emergency), mark as contacted, reassign or clear
- Vendor Reviews: internal star ratings per job (quality, speed, communication, price, overall) with notes — visible in vendor detail panel and aggregated into stats
- Plan-based feature gating: property limits (trial=2, starter=5, growth/pro=unlimited), staff assignment (growth+)
- Landlord profile page: edit name, phone, company name
- Terms & Conditions and Privacy Policy pages

## File Structure
- `shared/schema.ts` - Drizzle schema (properties, maintenanceRequests, requestNotes, requestMessages, maintenanceStaff, repairCosts, recurringTasks, vendors, vendorAssignments, vendorReviews, maintenanceActivityLog tables; TRADE_CATEGORIES constant)
- `shared/models/auth.ts` - Replit Auth schema (users, sessions tables) + Stripe fields + phone, companyName
- `shared/routes.ts` - Shared route types
- `server/routes.ts` - API routes (app + Stripe checkout/portal/plans + profile + notes + tenants + stats)
- `server/storage.ts` - Storage interface (CRUD for properties, requests, staff, notes, messages, costs, recurring tasks, vendors, assignments, reviews, activity log)
- `server/stripeClient.ts` - Stripe client using Replit connector credentials
- `server/webhookHandlers.ts` - Stripe webhook processing via stripe-replit-sync
- `server/seed-products.ts` - Script to create Stripe products/prices
- `server/index.ts` - Server startup with auto-seeding of Stripe products
- `server/db.ts` - Database connection
- `server/replit_integrations/` - Auth + Object Storage integrations
- `client/src/App.tsx` - Routes and app wrapper
- `client/src/pages/` - Landing, Features, Dashboard, Properties, TenantReport, PrintFlyer, Pricing, Staff, TrackRequest, Profile, Terms, Privacy, Tenants, Billing, CostTracking, RecurringMaintenance, Vendors
- `client/src/components/layout/AppLayout.tsx` - Sidebar layout with Requests, Properties, Tenants, Staff, Vendors, Costs, Scheduled, Billing, Pricing nav; mobile bottom nav shows Requests, Properties, Scheduled, More
- `client/src/hooks/` - Auth, properties, requests, staff, upload, subscription, use-vendors hooks

## Auth System
- Login page: `/login` — email/password form with "Sign In" / "Create Account" tabs
- Signup: POST /api/auth/signup (email, password, firstName, lastName) — creates user, hashes password with bcrypt, logs in
- Signin: POST /api/auth/signin (email, password) — validates credentials, creates session
- Demo login: POST /api/demo-login (landlord@test.com / demo123) — unchanged
- Replit Auth: GET /api/login — still works for owner account (user ID 55210273)
- isAuthenticated middleware updated to handle both `isLocalAuth: true` (email/password) and OIDC (Replit Auth) sessions
- passwordHash column added to users table; ID generated with crypto.randomUUID() on signup
- runColumnMigrations() runs on startup to add password_hash column in production
- Landing page login buttons all redirect to /login (changed from /api/login)
- "Try the demo" link on /login redirects to /?demo=1 which auto-opens demo modal

## Email Notifications (server/emailService.ts)
- Uses Resend SDK with RESEND_API_KEY env var
- TO ACTIVATE: set RESEND_API_KEY secret (get key from resend.com → API Keys) — OR connect the Resend integration via integrations panel
- Optional: set EMAIL_FROM secret (e.g. 'TenantTrack <notifications@tenant-track.com>') — requires verified sending domain in Resend
- sendNewRequestEmail: fired when tenant submits request → email sent to landlord
- sendStatusUpdateEmail: fired when request status changes → email sent to tenant (if tenantEmail set)
- sendStaffAssignmentEmail: fired when staff assigned → email sent to staff member
- All email sends are fire-and-forget (non-blocking, errors logged not thrown) — app works fine without RESEND_API_KEY

## Routes
- `/login` - Email/password login and signup page (public)
- `/` - Landing (unauthenticated) or Dashboard/Requests (authenticated)
- `/properties` - Property management (protected)
- `/tenants` - Tenant directory (protected)
- `/staff` - Maintenance staff management (protected, Growth+ plan)
- `/features` - Detailed features breakdown (public)
- `/vendors` - Vendor management (protected): add/edit/archive/delete contractors, search/filter, preferred vendor toggle, detail view with stats and reviews
- `/costs` - Repair cost tracking & reports (protected)
- `/scheduled` - Recurring maintenance scheduling (protected)
- `/billing` - Billing & subscription management (protected)
- `/pricing` - Subscription plans comparison (protected)
- `/profile` - Landlord profile editing (protected)
- `/flyer/:propertyId` - Printable flyer with QR code (protected)
- `/report/:propertyId` - Public tenant maintenance form
- `/track/:code` - Public request tracking page (no auth)
- `/terms` - Terms and Conditions (public)
- `/privacy` - Privacy Policy (public)

## API Routes
- `GET /api/profile` - Get landlord profile
- `PATCH /api/profile` - Update landlord profile (firstName, lastName, phone, companyName)
- `GET /api/dashboard/stats` - Get dashboard analytics (total, new, in-progress, completed, emergencies)
- `GET /api/tenants` - Get tenant directory (aggregated from requests)
- `DELETE /api/tenants` - Delete tenant and all their requests (body: {email, phone})
- `DELETE /api/properties/:id` - Delete property (cascades: all requests with costs/notes/messages, recurring tasks, then property)
- `DELETE /api/requests/:id` - Delete a request (cascades: costs, notes, messages, then request)
- `GET /api/messages/:requestId` - Get messages for a request (landlord, protected)
- `POST /api/messages/:requestId` - Send message to tenant (landlord, protected)
- `GET /api/requests/track/:code/messages` - Get messages for a request (tenant, public via tracking code)
- `POST /api/requests/track/:code/messages` - Send message to landlord (tenant, public via tracking code)
- `GET /api/notes/:requestId` - Get notes for a request
- `POST /api/notes/:requestId` - Add a note to a request
- `GET /api/costs/report` - Get cost report (query: startDate, endDate, propertyId)
- `GET /api/costs/export` - Export costs as CSV (query: startDate, endDate, propertyId)
- `GET /api/costs/:requestId` - Get costs for a specific request
- `POST /api/costs/:requestId` - Add a cost to a request
- `DELETE /api/costs/:costId` - Delete a cost entry
- `GET /api/recurring` - Get all recurring tasks
- `POST /api/recurring` - Create a recurring task
- `PATCH /api/recurring/:id` - Update a recurring task
- `POST /api/recurring/:id/complete` - Mark task complete + auto-schedule next
- `DELETE /api/recurring/:id` - Delete a recurring task
- `GET /api/vendors` - Get all vendors for landlord
- `POST /api/vendors` - Create vendor
- `PATCH /api/vendors/:id` - Update vendor (name, trade, contact, status: active/archived)
- `DELETE /api/vendors/:id` - Delete vendor (cascades assignments/reviews)
- `GET /api/vendors/top` - Top 5 vendors by job count with avg rating
- `GET /api/vendors/:id/stats` - Vendor stats (totalJobs, avgRating, lastAssignedAt)
- `GET /api/vendors/:id/reviews` - All internal reviews for a vendor
- `GET /api/requests/:id/vendor-assignment` - Get vendor assignment for a request
- `PATCH /api/requests/:id/vendor-assignment` - Assign/reassign vendor to request
- `DELETE /api/requests/:id/vendor-assignment` - Clear vendor assignment
- `PATCH /api/requests/:id/vendor-contacted` - Mark vendor as contacted/not-contacted
- `GET /api/requests/:id/vendor-review` - Get internal review for a completed vendor job
- `POST /api/requests/:id/vendor-review` - Submit internal vendor review (ratings + notes)
- `GET /api/requests/:id/activity` - Get activity log for a request (vendor events)
- `GET /api/stripe/plans` - Get subscription plans (filtered by tier metadata)
- `GET /api/stripe/subscription` - Get current subscription status
- `POST /api/stripe/checkout` - Create Stripe checkout session
- `POST /api/stripe/portal` - Create Stripe billing portal session

## Stripe Setup
- Products auto-seeded on startup via `seedStripeProducts()` in server/index.ts
- Products also seedable manually via `server/seed-products.ts`
- Plans query filters by `metadata->>'tier' IS NOT NULL` to exclude duplicates
- Pricing page shows hardcoded plan info as fallback when Stripe data hasn't synced
- stripe-replit-sync manages `stripe` schema tables automatically (DO NOT modify)
- Webhook route registered BEFORE express.json() middleware in server/index.ts
- Users table has stripe_customer_id, stripe_subscription_id, subscription_tier columns

## Design
- Dark mode theme (always dark, no toggle): dark green-black backgrounds, white text, forest green accents
- Primary color: forest green (HSL 148 55% 36%)
- Logo: square logo with house/trees/tools; banner image for hero
- Contact: support@tenant-track.com, (503) 380-6482, www.tenant-track.com
- Sidebar nav: Requests, Properties, Tenants, Staff, Billing, Pricing + clickable profile at bottom

## Demo Login
- Public demo account: landlord@test.com / demo123
- Demo user ID: "demo-landlord", set to Pro tier
- POST /api/demo-login endpoint validates credentials and creates session via passport
- Demo data auto-seeded on first login: 2 properties, 5 requests, 4 costs, 3 notes, 2 staff, 3 recurring tasks, 5 vendors (Carlos Ruiz/Plumbing, Janet Park/Electrical, Tom Wallace/HVAC, Marcus Lee/Handyman, Sandra Vega/Painting)
- "Try Demo" button on Landing page opens login modal with pre-filled credentials

## Notes
- Object storage wildcard route uses regex syntax for Express 5 compatibility
- Logo assets in `attached_assets/` imported via `@assets/` alias
- Stripe connector handles API keys automatically (no manual .env needed)
- Deployment: autoscale with `npm run build` + `node dist/index.mjs`
- Build outputs ESM format (dist/index.mjs) with __dirname shim in banner
- Stripe initialization deferred to after server listen (non-blocking)
- Auto-seeds Stripe products in both dev and production environments
