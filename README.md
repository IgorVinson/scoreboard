# MetricFlow (Scoreboard)

Analytics dashboard SaaS for tracking objectives, metrics, and reports with Stripe subscriptions.

<!-- Add screenshot here -->

## Overview

MetricFlow is a comprehensive analytics and goal-tracking SaaS platform designed for businesses and teams to monitor key objectives, track performance metrics, and generate detailed reports. With built-in subscription management via Stripe, rich text note-taking, and data visualization, it provides everything needed for data-driven decision making.

## Key Features

- **Objective Tracking**: Set, monitor, and update organizational goals and OKRs
- **Metrics Dashboard**: Real-time visualization of key performance indicators
- **Deep Analytics**: Multi-level data exploration with drill-down capabilities
- **Rich Text Reports**: Create detailed reports with the TipTap editor (markdown support)
- **Subscription Management**: Stripe-powered billing with multiple plan tiers
- **Team Collaboration**: Share objectives and reports across team members
- **Virtual Manager**: AI-powered insights and recommendations
- **Data Export**: Export reports and metrics in multiple formats
- **Customizable Views**: Tailor dashboards to specific roles and needs

## Tech Stack

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-008CDD?style=for-the-badge&logo=stripe&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000000?style=for-the-badge)
![TipTap](https://img.shields.io/badge/TipTap-7B68EE?style=for-the-badge)
![Recharts](https://img.shields.io/badge/Recharts-22B5BF?style=for-the-badge)

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase project ([Create one free](https://supabase.com/))
- Stripe account ([Create one](https://stripe.com/))

### Installation

```bash
# Clone the repository
git clone https://github.com/IgorVinson/scoreboard.git
cd scoreboard

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Run the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Environment Variables

Create a `.env` file:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App Config
VITE_APP_URL=http://localhost:5173
```

## Project Structure

```
scoreboard/
├── src/
│   ├── components/         # React components
│   │   ├── Dashboard.tsx
│   │   ├── ReportView.tsx
│   │   ├── ObjectivesMetricsTable.tsx
│   │   ├── DeepOverviewTable.tsx
│   │   ├── NotesEditor.tsx
│   │   └── virtual-manager-toggle.tsx
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions
│   ├── pages/             # Application pages
│   │   ├── landing.tsx
│   │   ├── dashboard.tsx
│   │   ├── login.tsx
│   │   ├── checkout.tsx
│   │   ├── subscription.tsx
│   │   └── payment-success.tsx
│   ├── services/          # API services (Supabase, Stripe)
│   └── types/             # TypeScript interfaces
├── public/                # Static assets
├── supabase/              # Supabase migrations and functions
└── package.json
```

## Features in Detail

### Objective Tracking

Create and manage OKRs (Objectives and Key Results):
- Set measurable targets
- Track progress with automatic calculations
- Link metrics to objectives
- Update statuses in real-time

### Metrics Dashboard

Visualize data with Recharts:
- Line charts for trends over time
- Bar charts for comparisons
- Pie charts for distribution
- Custom date ranges

### Rich Text Notes

Full-featured editor powered by TipTap:
- Markdown support
- Task lists
- Formatting (bold, italic, headings)
- Embeddable metrics

### Subscription Management

Stripe integration for SaaS billing:
- Multiple subscription tiers
- Secure checkout flow
- Subscription status management
- Payment history

### Virtual Manager

AI-powered insights:
- Automated metric analysis
- Trend identification
- Recommendations for improvement
- Anomaly detection

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run type-check` - Run TypeScript compiler
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Database Schema

### Core Tables

- **profiles**: User profiles and subscription status
- **organizations**: Company/team workspaces
- **objectives**: Goals and OKRs
- **metrics**: Measurable data points
- **reports**: Generated reports with content
- **subscriptions**: Stripe subscription data

## Stripe Setup

1. Create products and prices in Stripe Dashboard
2. Configure webhook endpoint: `/api/webhooks/stripe`
3. Add webhook events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.deleted`

## Deployment

### Vercel

```bash
npm i -g vercel
vercel --prod
```

Configure environment variables in Vercel dashboard.

### Stripe Webhook (Production)

```bash
stripe listen --forward-to https://your-app.com/api/webhooks/stripe
```

## License

MIT
