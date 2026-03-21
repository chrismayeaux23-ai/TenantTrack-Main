# VendorTrust

VendorTrust is a modern maintenance dispatch and vendor coordination platform built for landlords and property managers.

It replaces messy calls, texts, and spreadsheets with a structured system for automatically assigning vendors, managing schedules, tracking job progress, and handling maintenance operations end-to-end.

---

## 🚀 What VendorTrust Solves

Maintenance coordination is one of the most chaotic parts of property management.

* Vendors don’t respond
* Scheduling is inconsistent
* Jobs fall through the cracks
* Follow-ups take too much time
* There’s no clear system of record

VendorTrust turns this into a **clear, automated workflow**:

1. A request is created
2. The best vendor is recommended or assigned
3. The vendor receives a secure job link
4. The vendor accepts or proposes a time
5. The job is scheduled and tracked
6. Notifications keep everyone in sync
7. The system escalates if a vendor doesn’t respond

---

## 🧠 Core Features

### ⚙️ Smart Dispatch System

* Recommend or auto-assign the best vendor
* Scoring based on trust, performance, and availability
* Preferred vendor prioritization
* Fallback vendor suggestions if no response

### 🔗 Vendor Magic-Link Portal

* Vendors access jobs without creating accounts
* Accept, decline, or propose new time
* Mark en route, started, and completed
* Submit notes and completion details

### 📅 Scheduling & Calendar

* Schedule and reschedule jobs easily
* Day, week, and list views
* Conflict detection for vendor double-booking
* Track upcoming workload across properties

### ⏱ SLA & Escalation Engine

* Response deadlines based on urgency
* Detect no-response scenarios automatically
* Recommend next-best vendor
* Keep jobs from getting stuck

### 📊 Dispatch Board (Ops Command Center)

* Kanban-style workflow:

  * Needs Dispatch
  * Awaiting Response
  * Scheduled
  * In Progress
  * Waiting on Parts
  * Completed
* Prioritize urgent and overdue jobs
* Take quick actions directly from the board

### 🛠 Vendor Management & Trust Scores

* Track vendor performance over time
* Trust score based on:

  * job history
  * reviews
  * no-show behavior
* Identify top-performing contractors instantly

### 📋 Maintenance Request Management

* Full lifecycle tracking from intake to completion
* Store notes, invoices, materials, and final cost
* Maintain clean audit trail for every job

### 🔔 Automated Notifications

* Vendor assignment and reminders
* Vendor response alerts
* Scheduling and rescheduling updates
* Tenant updates when work is scheduled or completed

### 🏠 Tenant Request System

* QR code submission flow (no app required)
* Photo uploads and detailed issue reporting
* Status tracking via unique code

---

## 🧱 Tech Stack

**Frontend**

* React + TypeScript
* Vite
* TailwindCSS
* Shadcn UI / Radix UI

**Backend**

* Node.js + Express
* TypeScript
* Drizzle ORM

**Database**

* PostgreSQL

**Integrations**

* Stripe (subscriptions)
* Resend (email notifications)
* Replit Object Storage (file uploads)

---

## ⚡ Getting Started

```bash
git clone https://github.com/your-username/vendortrust.git
cd vendortrust
npm install
npm run dev
```

---

## 🔐 Environment Variables

Required:

* DATABASE_URL
* SESSION_SECRET

Optional:

* RESEND_API_KEY
* GOOGLE_CLIENT_ID
* GOOGLE_CLIENT_SECRET
* EMAIL_FROM

---

## 🧪 Demo Access

Email: [landlord@test.com](mailto:landlord@test.com)
Password: demo123

---

## 🎯 Product Vision

VendorTrust is evolving into a fully automated maintenance dispatch system where:

* The right vendor is assigned instantly
* Vendors respond without manual follow-up
* Scheduling happens seamlessly
* Jobs never fall through the cracks

---

## 🚧 Current Status

VendorTrust is in **private beta**.

Core workflows are implemented and actively being refined based on real usage.

---

## 🤝 Contributing

Contributions, feedback, and ideas are welcome.

---

## 📄 License

MIT License

---

## 👤 Author

Christopher Mayeaux

VendorTrust is a vertical SaaS platform built to modernize maintenance operations for landlords and property managers.
