# TenantTrack

A mobile-first SaaS web app where landlords manage maintenance requests via QR codes.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI (Vite)
- **Backend**: Express.js on port 5000
- **Database**: PostgreSQL via Drizzle ORM
- **Auth**: Replit Auth (landlord login)
- **Storage**: Replit Object Storage (tenant photo uploads)
- **Payments**: Stripe (subscriptions with 14-day free trial)

## Key Features
- Landlords sign up, add properties (each generating a unique QR code)
- Tenants scan QR code to access public form at `/report/:propertyId` (no account needed)
- Tenants can upload up to 3 photos per maintenance request
- Dashboard with analytics stats (total, new, in-progress, completed) and status badges
- Request notes/comments system for landlords to add internal notes per request
- Tenant Directory page showing all tenants who've submitted requests with contact info
- Billing page with Stripe portal integration for payment methods, invoices, plan management
- Printable flyer template at `/flyer/:propertyId` for landlords to post on tenant doors
- Stripe subscription billing with 3 tiers: Starter ($19), Growth ($39), Pro ($59)
- Pricing page with hardcoded plan info (always displays) + Stripe checkout when products synced
- Auto-seeding of Stripe products on startup if they don't exist in the connected Stripe account
- Maintenance staff management: landlords add/remove team members, assign requests to staff
- Tenant tracking: each request gets a unique 8-char tracking code; tenants check status at `/track/:code`
- Plan-based feature gating: property limits (trial=2, starter=5, growth/pro=unlimited), staff assignment (growth+)
- Landlord profile page: edit name, phone, company name
- Terms & Conditions and Privacy Policy pages

## File Structure
- `shared/schema.ts` - Drizzle schema (properties, maintenanceRequests, requestNotes, maintenanceStaff tables)
- `shared/models/auth.ts` - Replit Auth schema (users, sessions tables) + Stripe fields + phone, companyName
- `shared/routes.ts` - Shared route types
- `server/routes.ts` - API routes (app + Stripe checkout/portal/plans + profile + notes + tenants + stats)
- `server/storage.ts` - Storage interface (CRUD for properties, requests, staff, notes)
- `server/stripeClient.ts` - Stripe client using Replit connector credentials
- `server/webhookHandlers.ts` - Stripe webhook processing via stripe-replit-sync
- `server/seed-products.ts` - Script to create Stripe products/prices
- `server/index.ts` - Server startup with auto-seeding of Stripe products
- `server/db.ts` - Database connection
- `server/replit_integrations/` - Auth + Object Storage integrations
- `client/src/App.tsx` - Routes and app wrapper
- `client/src/pages/` - Landing, Dashboard, Properties, TenantReport, PrintFlyer, Pricing, Staff, TrackRequest, Profile, Terms, Privacy, Tenants, Billing
- `client/src/components/layout/AppLayout.tsx` - Sidebar layout with Requests, Properties, Tenants, Staff, Billing, Pricing nav
- `client/src/hooks/` - Auth, properties, requests, staff, upload, subscription hooks

## Routes
- `/` - Landing (unauthenticated) or Dashboard/Requests (authenticated)
- `/properties` - Property management (protected)
- `/tenants` - Tenant directory (protected)
- `/staff` - Maintenance staff management (protected, Growth+ plan)
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
- `GET /api/notes/:requestId` - Get notes for a request
- `POST /api/notes/:requestId` - Add a note to a request
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

## Notes
- Object storage wildcard route uses regex syntax for Express 5 compatibility
- Logo assets in `attached_assets/` imported via `@assets/` alias
- Stripe connector handles API keys automatically (no manual .env needed)
- Deployment: autoscale with `npm run build` + `node dist/index.mjs`
- Build outputs ESM format (dist/index.mjs) with __dirname shim in banner
- Stripe initialization deferred to after server listen (non-blocking)
- Auto-seeds Stripe products in both dev and production environments
