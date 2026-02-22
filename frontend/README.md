# Freelance Reach

A modern, professional freelance platform built with Next.js 15, featuring a clean architecture and scalable structure.

## ✨ Features

- 🎨 Modern UI with Shadcn UI and Tailwind CSS
- 📱 Responsive design with mobile-first approach
- 🔄 Collapsible sidebar navigation
- 🎯 Feature-based architecture for scalability
- 📊 Dashboard with breadcrumb navigation
- ⚡ Built with Next.js 15 and Turbopack
- 🎭 TypeScript for type safety

## 🚀 Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### Build for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

This project follows a feature-based architecture. See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for detailed documentation.

```
src/
├── app/              # Next.js App Router pages
├── components/       # Reusable components
│   ├── layout/      # Layout components
│   ├── navigation/  # Navigation components
│   └── ui/          # Shadcn UI primitives
├── features/        # Feature modules
│   ├── home/
│   └── dashboard/
├── config/          # App configuration
├── constants/       # Shared constants
├── hooks/           # Custom React hooks
├── lib/             # Utilities
└── types/           # TypeScript types
```

## 📚 Documentation

- **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** - Complete project structure guide
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Architecture diagrams and flows
- **[MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)** - Migration from old structure
- **[REORGANIZATION_SUMMARY.md](REORGANIZATION_SUMMARY.md)** - Summary of recent changes

## 🛠️ Tech Stack

- **Framework:** Next.js 15.5.2
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **UI Components:** Shadcn UI + Radix UI
- **Icons:** Lucide React
- **Fonts:** Geist Sans & Geist Mono

## 🧹 Cleanup Old Files (Optional)

If you want to remove old component files that have been reorganized:

```bash
.\cleanup-old-files.ps1

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
```
