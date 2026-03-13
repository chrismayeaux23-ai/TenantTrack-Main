# Tenant-Track

Tenant-Track is a SaaS platform designed to help landlords and property owners manage properties, tenants, maintenance requests, and repair costs in one centralized dashboard.

The system allows tenants to submit maintenance issues while landlords track requests, assign staff, monitor expenses, and manage multiple properties.

---

## Product Walkthrough

Watch a quick demo of Tenant Track:

[![Tenant Track Demo](https://img.youtube.com/vi/3Y8qK9X28ko/0.jpg)](https://www.youtube.com/watch?v=3Y8qK9X28ko)

---

## Live Demo

You can explore the platform using the demo credentials below:

Email: landlord@test.com  
Password: demo123

---

# Feature Overview

The following sections explain how TenantTrack works and how it helps landlords manage maintenance efficiently.

---

## Who TenantTrack Is Built For

![Built For](screenshots/feature-built-for.png)

---

## Everything a Landlord Needs

TenantTrack replaces scattered texts, spreadsheets, and sticky notes with one organized maintenance management system.

![Overview](screenshots/feature-overview.png)

---

## Smart Landlord Dashboard

Track all maintenance requests across every property from one dashboard.

![Dashboard](screenshots/feature-smart-dash.png)

---

## QR Code Maintenance Request System

Tenants scan a QR code and submit maintenance issues instantly with photos and urgency level.

![QR System](screenshots/feature-qr-system.png)

---

## Tenant Request Tracking

Tenants receive a tracking code and can monitor request progress without calling or texting.

![Request Tracking](screenshots/feature-request-tracking.png)

---

## Tenant–Landlord Messaging

Built-in messaging keeps conversations tied directly to each maintenance request.

![Messaging](screenshots/feature-messaging.png)

---

## Maintenance Staff Management

Assign maintenance requests to staff members and track workload across properties.

![Staff Management](screenshots/feature-staff-management.png)

---

## Recurring Maintenance Scheduling

Prevent expensive repairs by scheduling recurring maintenance tasks.

![Recurring Maintenance](screenshots/feature-recurring-maintenance.png)

---

## Repair Cost Tracking & Reports

Track repair costs across properties and export reports for taxes and accounting.

![Cost Tracking](screenshots/feature-cost-tracking.png)

---

## Platform Metrics

TenantTrack helps landlords reduce maintenance coordination time and improve tenant communication.

![Metrics](screenshots/feature-metrics.png)

---

## Why Landlords Choose TenantTrack

TenantTrack focuses on simplicity and workflows designed specifically for independent landlords.

![Why Choose](screenshots/feature-why-choose.png)

---

## TenantTrack vs The Old Way

See how TenantTrack compares to traditional maintenance tracking using calls, texts, and spreadsheets.

![Why Switch](screenshots/feature-why-switch.png)

---

## Transparent Pricing

Simple pricing plans designed for independent landlords and small portfolios.

![Pricing](screenshots/feature-pricing.png)

---

## Screenshots - App UI

---

### Landing Page
![Landing Page](screenshots/ScreenshotLanding.png)

### Pricing
![Pricing](screenshots/Screenshot_Pricing.png)

### Property Management
![Property List](screenshots/Screenshot_PropertyList.png)

### Maintenance Requests
![Requests List](screenshots/Screenshot_RequestsList.png)

### Tenants Management
![Tenants List](screenshots/Screenshot_TenantsList.png)

### Staff Management
![Staff List](screenshots/Screenshot_StaffList.png)

### Cost Tracking
![Cost Tracking](screenshots/Screenshot_CostTracking.png)

### Task Reminders
![Task Reminders](screenshots/Screenshot_TaskReminders.png)

### Tenant QR Code Access
![Tenant QR Code](screenshots/Screenshot_QRcodeTenantSide.png)

---

## Features

- Property management dashboard
- Tenant database and management
- Maintenance request submission and tracking
- Maintenance staff management
- Cost tracking for repairs
- Task reminders and notifications
- QR code tenant request system
- Photo uploads for maintenance issues
- Centralized request dashboard

---

## Tech Stack

Frontend
- React
- Vite
- TailwindCSS
- Radix UI

Backend
- Node.js
- Express
- TypeScript

Database
- PostgreSQL
- Drizzle ORM

Integrations
- Stripe (subscription payments)
- WebSockets (real-time updates)
- Uppy (file uploads)

---

## Installation

Clone the repository:

```bash
git clone https://github.com/chrismayeaux23-ai/Tenant-Track.git
```

Navigate into the project folder:

```bash
cd Tenant-Track
```

Install dependencies:

```bash
npm install
```

Create your environment variables file:

```bash
cp .env.example .env
```

Start the development server:

```bash
npm run dev
```

---

## Environment Variables

Create a `.env` file based on `.env.example`.

Example configuration:

```env
NODE_ENV=development
PORT=5000

DATABASE_URL=postgresql://username:password@localhost:5432/tenanttrack

SESSION_SECRET=replace_with_secure_random_string

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

S3_BUCKET=
S3_ACCESS_KEY=
S3_SECRET_KEY=
```

---

## Project Structure

```text
client/        # React frontend
server/        # Express backend
db/            # Database schema and migrations
screenshots/   # README images
docs/          # Project documentation
.env.example   # Example environment variables
README.md      # Project documentation
LICENSE        # MIT license
```

---

## Required Services

Tenant Track requires the following services to run:

- Node.js
- PostgreSQL

Optional integrations:

- Stripe (for subscriptions)
- S3 compatible storage for file uploads

---

## Development

Run the development server:

```bash
npm run dev
```

Build the application:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

---

## Roadmap

Planned future improvements:

- Mobile tenant portal
- Maintenance scheduling
- Vendor marketplace
- Push notifications
- Property financial reports
- AI repair request categorization

---

## License

MIT License

---

## Author

Christopher Mayeaux

Tenant-Track was created as a vertical SaaS solution designed to simplify property maintenance management for independent landlords and property investors.