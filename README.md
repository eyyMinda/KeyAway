# 🎁 KeyAway

A modern, SEO-optimized website built with Next.js 14 and Sanity v3, showcasing the latest giveaway CD keys for pc optimization programs like IOBIT Malware Fighter. This project allows easy CMS management, user comments, while keeping the frontend fast, compact, and fully responsive.

## 🌟 Features

- Latest CD keys: Display multiple programs with CD keys, versions, and statuses.
- Sanity CMS: Manage programs and CD keys easily through an embedded dashboard.
- Server-side fetching: Optimized for SEO with server-rendered pages.
- Dynamic program pages: Each program has its own slug-based route.
- Comments: Giscus integration for GitHub-based user comments.
- TypeScript & Tailwind CSS: Strong typing and modern styling.
- Optimized images: Uses Next.js <Image> component with Sanity image URLs.

# 📂 Project Structure

```
/src
  /app          → Next.js App Router pages
    /program    → Dynamic program pages
    /sanity     → Embedded Sanity Studio
  /components   → Reusable UI components
  /lib          → Sanity client & queries
  /styles       → Global styles
  /types        → TypeScript types for Program, CDKey
```

# ⚡ Tech Stack

- [Next.js 14](https://nextjs.org/)
- [Sanity v3](https://www.sanity.io/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Giscus](https://giscus.app/) for comments
- [Vercel](https://vercel.com/) compatible for deployment

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

```
SANITY_STUDIO_API_VERSION=2025-09-07
SANITY_STUDIO_PROJECT_ID=yourProjectId
SANITY_STUDIO_DATASET=production
```

For embedded Sanity Studio (./src/app/sanity), also create:

```
SANITY_STUDIO_API_VERSION=2025-09-07
SANITY_STUDIO_PROJECT_ID=yourProjectId
SANITY_STUDIO_DATASET=production
```

## 4. Run the development server

```
npm run dev
```

- Next.js: http://localhost:3000
- Embedded Studio: http://localhost:3000/studio

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

# 💬 Comments Integration

- Uses [Giscus](https://giscus.app/) to allow visitors to leave comments.
- Requires configuring your GitHub repo and category IDs in the ProgramComments client component.

# 🖼 Image Handling

- Images use Sanity ImageObject type.
- Optimized with Next.js <Image> component for automatic resizing and blur placeholders.

# 📌 Notes

- Server Components: Pages and most components are server-side for SEO and performance.
- Client Components: Only use "use client" for components requiring browser APIs (e.g., Giscus).
- SEO Optimized: Program pages are rendered server-side, ready for search engines.

# 💻 Deployment

- Fully compatible with Vercel.
- Ensure environment variables are set in Vercel Dashboard.

Run build:

```
npm run build
npm run start
```

# 📄 License

MIT License © [eyyMinda](https://github.com/eyyMinda)
