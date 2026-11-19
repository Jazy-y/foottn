# FootTN

**FootTN** is a football community and stadium-booking web application built with Next.js, React, TypeScript, and Firebase. It brings together players, teams, stadium owners, and administrators in one interface.

**Live demo:** [foottn.vercel.app](https://foottn.vercel.app/) · **Source:** [github.com/Jazy-y/foottn](https://github.com/Jazy-y/foottn)

> **Project status:** Portfolio / demonstration project. Some integrations, particularly payment confirmation, are still being completed. Do not use the current payment implementation for real transactions without a security review and server-side verification.

## What the application includes

- **Stadium discovery and bookings:** browse stadiums, view stadium details, and manage bookings.
- **Player accounts:** registration, login, profiles, and personal dashboards.
- **Teams and events:** create teams, manage invitations, team chat, and football events.
- **Community features:** activity feed, posts, comments, and notifications.
- **Stadium-owner area:** stadium management, reservations, and analytics screens.
- **Administration:** interfaces for users, stadium approvals, content moderation, support tickets, and analytics.
- **Additional modules:** wallet and invoice interfaces, AI-related service endpoints, and progressive web app (PWA) configuration.

Some features are works in progress; the presence of a page or endpoint does not mean every underlying workflow has been verified in production.

## Technology stack

| Area | Technologies |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling and UI | Tailwind CSS 4, React components, Lucide icons, Framer Motion |
| Authentication and data | Firebase Authentication, Cloud Firestore |
| Media | Cloudinary integration; Firebase Storage client initialization |
| Payments | Stripe integration (incomplete end-to-end payment confirmation) |
| PDF and charts | jsPDF, pdf-lib, Recharts |
| Deployment | Vercel (linked demo deployment) |

See [`package.json`](package.json) for the full dependency list.

## Getting started

### Requirements

- Node.js version compatible with Next.js 16
- npm
- A Firebase project, with Authentication and Cloud Firestore configured
- Optional credentials for integrations you intend to use

### Install and run

```bash
git clone https://github.com/Jazy-y/foottn.git
cd foottn
npm ci
cp .env.example .env.local
npm run dev
```

On Windows PowerShell, use `Copy-Item .env.example .env.local` instead of `cp`.

Populate `.env.local` with values from your own services. Then open [http://localhost:3000](http://localhost:3000).

**Important:** The repository includes `firestore.rules` and `firestore.indexes.json`; deploy and review them for your own Firebase project before testing authenticated workflows.

### Environment configuration

Start from [`.env.example`](.env.example). The Firebase variables prefixed with `NEXT_PUBLIC_` contain browser-side Firebase app configuration, **not** privileged server credentials.

Depending on which integration you enable, the source also references:

- `STRIPE_WEBHOOK_SECRET` for Stripe webhook signature verification
- `RESEND_API_KEY` for booking notification emails
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` and `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` for Cloudinary image uploads

Never commit real private keys, passwords, service account files, or `.env.local`.

### Useful scripts

```bash
npm run dev       # Start local development
npm run lint      # Check lint rules
npm run build     # Create production build
npm run start     # Serve the production build
```

These commands are documented from `package.json`; build and test results are not asserted here.

## Project structure

```text
src/
  app/              # App Router pages and API route handlers
  components/       # Reusable interface and layout components
  contexts/         # Authentication state
  hooks/            # React hooks
  lib/              # Firebase, Cloudinary, and application utilities
  services/         # Data access and service modules
  types/            # Shared TypeScript types
scripts/            # Development / administrative utilities
public/             # Static assets
firestore.rules      # Firestore access rules
firestore.indexes.json
```

## Security and development notes

This is an evolving project, not a security-audited production booking or payment service. In particular, server-side payment amount verification, trusted payment confirmation, role provisioning, and API authorization require further review. Never treat client-provided payment status as proof of payment.

To report a security concern, contact the repository owner privately rather than publishing credentials or exploit details in a GitHub issue.

## Portfolio notes

This repository demonstrates work on a multi-role web application with authenticated interfaces, Firestore data modeling, booking workflows, admin/owner dashboards, and integrations with third-party services.

Screenshots and a detailed architecture diagram can be added after validating the corresponding functionality.

---

Built as a full-stack development portfolio project.
