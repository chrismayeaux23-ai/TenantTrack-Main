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
- Dashboard with status badges (Green=Completed, Red=Emergency, Yellow=In-Progress)
- Printable flyer template at `/flyer/:propertyId` for landlords to post on tenant doors
- Stripe subscription billing with 3 tiers: Starter ($19), Growth ($39), Pro ($59)
- Maintenance staff management: landlords add/remove team members, assign requests to staff
- Tenant tracking: each request gets a unique 8-char tracking code; tenants check status at `/track/:code`
- Plan-based feature gating: property limits (trial=2, starter=5, growth/pro=unlimited), staff assignment (growth+)
- Landlord profile page: edit name, phone, company name
- Terms & Conditions and Privacy Policy pages

## File Structure
- `shared/schema.ts` - Drizzle schema (properties, maintenanceRequests, maintenanceStaff tables)
- `shared/models/auth.ts` - Replit Auth schema (users, sessions tables) + Stripe fields + phone, companyName
- `shared/routes.ts` - Shared route types
- `server/routes.ts` - API routes (app + Stripe checkout/portal/plans + profile)
- `server/storage.ts` - Storage interface (CRUD)
- `server/stripeClient.ts` - Stripe client using Replit connector credentials
- `server/webhookHandlers.ts` - Stripe webhook processing via stripe-replit-sync
- `server/seed-products.ts` - Script to create Stripe products/prices
- `server/db.ts` - Database connection
- `server/replit_integrations/` - Auth + Object Storage integrations
- `client/src/App.tsx` - Routes and app wrapper
- `client/src/pages/` - Landing, Dashboard, Properties, TenantReport, PrintFlyer, Pricing, Staff, TrackRequest, Profile, Terms, Privacy
- `client/src/components/layout/AppLayout.tsx` - Sidebar layout for landlord pages
- `client/src/hooks/` - Auth, properties, requests, staff, upload, subscription hooks

## Routes
- `/` - Landing (unauthenticated) or Dashboard/Requests (authenticated)
- `/properties` - Property management (protected)
- `/pricing` - Subscription plans and billing (protected)
- `/profile` - Landlord profile editing (protected)
- `/flyer/:propertyId` - Printable flyer with QR code (protected)
- `/report/:propertyId` - Public tenant maintenance form
- `/staff` - Maintenance staff management (protected, Growth+ plan)
- `/track/:code` - Public request tracking page (no auth)
- `/terms` - Terms and Conditions (public)
- `/privacy` - Privacy Policy (public)

## API Routes
- `GET /api/profile` - Get landlord profile
- `PATCH /api/profile` - Update landlord profile (firstName, lastName, phone, companyName)
- `GET /api/stripe/plans` - Get subscription plans (filtered by tier metadata)
- `GET /api/stripe/subscription` - Get current subscription status
- `POST /api/stripe/checkout` - Create Stripe checkout session
- `POST /api/stripe/portal` - Create Stripe billing portal session

## Stripe Setup
- Products seeded via `server/seed-products.ts` (3 products with tier metadata)
- Plans query filters by `metadata->>'tier' IS NOT NULL` to exclude duplicates
- stripe-replit-sync manages `stripe` schema tables automatically (DO NOT modify)
- Webhook route registered BEFORE express.json() middleware in server/index.ts
- Users table has stripe_customer_id, stripe_subscription_id, subscription_tier columns

## Design
- Dark mode theme (always dark, no toggle): dark green-black backgrounds, white text, forest green accents
- Primary color: forest green (HSL 148 55% 36%)
- Logo: square logo with house/trees/tools; banner image for hero
- Contact: support@tenant-track.com, (503) 380-6482, www.tenant-track.com
- Custom domain: www.tenant-track.com (configured via Replit deployment settings)
- Sidebar nav: Requests, Properties, Staff, Pricing + clickable profile at bottom

## Notes
- Object storage wildcard route uses regex syntax for Express 5 compatibility
- Logo assets in `attached_assets/` imported via `@assets/` alias
- Stripe connector handles API keys automatically (no manual .env needed)
- Deployment configured as autoscale with `npm run build` + `npm run start`
- Build outputs ESM format (dist/index.mjs) with __dirname shim in banner
- Stripe initialization deferred to after server listen (non-blocking)
