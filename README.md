# 🎁 KeyAway

A modern, SEO-optimized platform built with Next.js 15 and Sanity v4, showcasing the latest giveaway CD keys for PC optimization programs. Features a comprehensive admin dashboard, real-time analytics, automatic key expiration system, and user engagement tracking while maintaining fast, responsive performance.

## 🌟 Features

### Core Platform

- **Latest CD Keys**: Display multiple programs with CD keys, versions, and real-time status updates
- **Sanity CMS**: Manage programs and CD keys through an embedded studio dashboard
- **Server-side Rendering**: Optimized for SEO with server-rendered pages and dynamic metadata
- **Dynamic Program Pages**: Each program has its own slug-based route with custom SEO
- **Comments System**: Giscus integration for GitHub-based user comments
- **Privacy & Terms**: Complete legal pages with transparent content policies

### Admin Dashboard

- **Analytics Dashboard**: Real-time user behavior tracking and engagement metrics
- **Event Tracking**: Monitor CD key copies, downloads, and social clicks
- **Program Management**: View and manage all programs with detailed statistics
- **Time-based Filtering**: Analyze data across different time periods
- **Visual Charts**: Interactive doughnut and bar charts for data visualization
- **Protected Access**: Secure admin authentication with Sanity user verification

### Advanced Features

- **Automatic Key Expiration**: Server-side system that automatically updates expired CD keys
- **Real-time Tracking**: Track user interactions (copy, download, social clicks) with privacy protection
- **Rate Limiting**: Middleware prevents excessive API calls and updates
- **Batch Updates**: API endpoints for bulk key status updates
- **SEO Optimization**: Dynamic meta tags, Open Graph, and Twitter cards
- **Responsive Design**: Mobile-first approach with Tailwind CSS

# 📂 Project Structure

```
/src
  /app                    → Next.js App Router pages
    /admin               → Admin dashboard (analytics, programs, events)
    /api                 → API routes (tracking, admin auth, key updates)
    /program             → Dynamic program pages
    /privacy             → Privacy policy page
    /terms               → Terms of service page
    /studio              → Embedded Sanity Studio
  /components            → Reusable UI components
    /admin               → Admin dashboard components
    /program             → Program-specific components
    /layout              → Header, footer, navigation
  /lib                   → Utilities and configurations
    adminAuth.ts         → Admin authentication logic
    cdKeyUtils.ts        → CD key processing utilities
    sanityActions.ts     → Server actions for Sanity updates
    trackEvent.ts        → Event tracking functions
  /sanity                → Sanity configuration
    /schemaTypes         → Content schemas
  /types                 → TypeScript type definitions
```

# ⚡ Tech Stack

- [Next.js 15](https://nextjs.org/) - React framework with App Router
- [Sanity v4](https://www.sanity.io/) - Headless CMS with real-time updates
- [TypeScript](https://www.typescriptlang.org/) - Type safety and developer experience
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Giscus](https://giscus.app/) - GitHub-based comment system
- [Vercel Analytics](https://vercel.com/analytics) - Performance and user analytics
- [React Icons](https://react-icons.github.io/react-icons/) - Icon library
- [Vercel](https://vercel.com/) - Deployment platform

🚀 Getting Started

## 1. Clone the repo

```
git clone https://github.com/yourusername/your-repo.git
cd your-repo
```

## 2. Install dependencies

```
npm install
# or
yarn
```

## 3. Configure environment variables

Create .env.local at the project root:

```bash
# Sanity Configuration (Server-side only)
SANITY_STUDIO_API_VERSION=2025-09-07
SANITY_STUDIO_PROJECT_ID=yourProjectId
SANITY_STUDIO_DATASET=production

# Client-side Sanity Access (Available on both client and server)
NEXT_PUBLIC_SANITY_PROJECT_ID=yourProjectId
NEXT_PUBLIC_SANITY_DATASET=production

# Webhook Security
SANITY_WEBHOOK_SECRET=yourWebhookSecret

# Analytics Security (IP Hashing)
ANALYTICS_SALT=yourRandomSaltString
```

### Environment Variable Types:

- **SANITY*STUDIO*\***: Server-side only, used by Sanity Studio and server functions
- **NEXT*PUBLIC*\***: Available on both client and server, used for client-side Sanity queries
- **SANITY_WEBHOOK_SECRET**: Secures webhook endpoints for content revalidation
- **ANALYTICS_SALT**: Used for hashing IP addresses in analytics tracking

## 4. Run the development server

```
npm run dev
```

- Next.js: http://localhost:3000
- Embedded Studio: http://localhost:3000/studio
- Admin Dashboard: http://localhost:3000/admin

# 📝 Adding Programs & CD Keys

1. Open the Studio dashboard: http://localhost:3000/studio
2. Add a Program document.
3. For each program, add CD Keys:
   - Key
   - Status (new, active, expired, limit)
   - Version
   - Valid from / until dates
   - Notes (optional)
4. Save → changes automatically appear on the frontend.

# 🔐 Admin Dashboard

Access the admin dashboard at `/admin` with Sanity user authentication:

## Analytics Dashboard

- **Real-time Metrics**: Track total events, active programs, social clicks, and unique pages
- **Interactive Charts**: Doughnut and bar charts for event distribution
- **Time Filtering**: Analyze data across different time periods (7 days, 30 days, custom range)
- **Event Details**: View detailed event logs with filtering capabilities

## Program Management

- **Program Overview**: View all programs with key statistics
- **CD Key Status**: Monitor working vs expired keys across all programs
- **Quick Actions**: Access Sanity Studio directly from admin panel

## Event Tracking

- **User Interactions**: Track CD key copies, download clicks, and social media engagement
- **Privacy Protection**: IP addresses are hashed, no personal data stored
- **Real-time Updates**: Events are tracked and displayed in real-time

# 💬 Comments Integration

- Uses [Giscus](https://giscus.app/) to allow visitors to leave comments.
- Requires configuring your GitHub repo and category IDs in the ProgramComments client component.

# 🔄 Automatic Key Expiration System

The platform includes an advanced system for automatically managing CD key expiration:

## Features

- **Server-side Updates**: Expired keys are automatically updated in Sanity CMS
- **Real-time Processing**: Keys are checked and updated on every program page load
- **Rate Limiting**: Middleware prevents excessive updates (5-minute intervals per program)
- **Batch Updates**: API endpoint (`/api/update-expired-keys`) to update all programs at once
- **Visual Indicators**: Clear status badges and expiring soon warnings

## How It Works

1. When a program page loads, the system checks all CD keys for expiration
2. Keys past their `validUntil` date are automatically marked as "expired"
3. Changes are persisted directly to Sanity CMS
4. Users see real-time status updates without page refresh

# 🖼 Image Handling

- Images use Sanity ImageObject type.
- Optimized with Next.js <Image> component for automatic resizing and blur placeholders.

# 📊 Analytics & Tracking

The platform includes comprehensive analytics and user interaction tracking:

## Tracked Events

- **CD Key Copies**: When users copy CD keys to clipboard
- **Download Clicks**: When users click download buttons
- **Social Clicks**: When users click social media links
- **Page Views**: Automatic tracking of page visits

## Privacy & Security

- **IP Hashing**: User IP addresses are hashed using `ANALYTICS_SALT` for privacy
- **No Personal Data**: Only interaction events are tracked, no personal information
- **Rate Limiting**: API endpoints are protected against abuse
- **Secure Storage**: All data stored securely in Sanity CMS
- **Salt-based Security**: IP addresses are hashed with a configurable salt for additional security

# 📌 Technical Notes

- **Server Components**: Pages and most components are server-side for SEO and performance
- **Client Components**: Only use "use client" for components requiring browser APIs (e.g., Giscus, admin dashboard)
- **SEO Optimized**: Program pages are rendered server-side with dynamic meta tags
- **Middleware**: Rate limiting and security middleware for API protection
- **Type Safety**: Full TypeScript implementation with strict type checking

# 💻 Deployment

- Fully compatible with Vercel with zero configuration
- Ensure all environment variables are set in Vercel Dashboard
- Webhook integration for automatic revalidation on content updates

## Build Commands

```bash
npm run build
npm run start
```

## Webhook Configuration

Set up Sanity webhooks to trigger revalidation:

- **URL**: `https://yourdomain.com/api/revalidate`
- **Secret**: Use the same value as `SANITY_WEBHOOK_SECRET`

# 📄 License

MIT License © [eyyMinda](https://github.com/eyyMinda)
