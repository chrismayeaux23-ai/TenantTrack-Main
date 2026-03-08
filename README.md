# Tenant Management Hub

Tenant Management Hub is a SaaS platform designed to help landlords and property owners manage properties, tenants, maintenance requests, and repair costs in one centralized dashboard.

The system allows tenants to submit maintenance issues while landlords track requests, assign staff, monitor expenses, and manage multiple properties.

---

## Live Demo

You can explore the platform using the demo credentials below:

Email: landlord@test.com  
Password: demo123

---

## Screenshots

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

Clone the repository

git clone https://github.com/chrismayeaux23-ai/Tenant-Management-Hub.git


Navigate to the project directory

cd Tenant-Management-Hub


Install dependencies

npm install


Create environment variables

cp .env.example .env


Start the development server

npm run dev


---

## Environment Variables

Create a `.env` file based on `.env.example`.

Example variables:

DATABASE_URL=
SESSION_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_BUCKET=


---

## Project Structure

client/ # React frontend
server/ # Express backend
db/ # Database schema and migrations
screenshots/ # README images
docs/ # Project documentation


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

Tenant Management Hub was created as a vertical SaaS solution designed to simplify property maintenance management for independent landlords and property investors.