# Portfolio

A modern, responsive portfolio website built with [Next.js](https://nextjs.org), bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 📋 Table of Contents

- [Features](#features)
- [Getting Started](#getting-started)
- [Development](#development)
- [Project Structure](#project-structure)
- [Customization](#customization)
- [Resources](#resources)
- [Deployment](#deployment)

## ✨ Features

- Built with **Next.js** for optimal performance
- Responsive design with **Tailwind CSS**
- Automatic font optimization using **Geist** font family
- Fast refresh during development
- Production-ready build system

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- npm, yarn, pnpm, or bun package manager

### Installation & Development

Run the development server using one of the following commands:

| Package Manager | Command |
|-----------------|---------|
| npm | `npm run dev` |
| yarn | `yarn dev` |
| pnpm | `pnpm dev` |
| bun | `bun dev` |

Then, open [http://localhost:3000](http://localhost:3000) in your browser to view the site.

## 💻 Development

### Project Structure

```
├── app/
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout component
│   └── page.tsx          # Home page
├── public/               # Static assets
├── package.json
├── tsconfig.json
└── next.config.ts
```

### Editing

- Start editing by modifying `app/page.tsx`
- Changes auto-update in the browser thanks to Next.js' fast refresh feature
- Global styles can be updated in `app/globals.css`

## 🎨 Customization

### Fonts

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) for automatic font optimization and loading. The [Geist](https://vercel.com/font) font family is pre-configured as the default font.

To change fonts, update the font imports in `app/layout.tsx`.

## 📚 Resources

Learn more and explore additional resources:

- **[Next.js Documentation](https://nextjs.org/docs)** - Core features and API reference
- **[Next.js Tutorial](https://nextjs.org/learn)** - Interactive learning guide
- **[Next.js GitHub](https://github.com/vercel/next.js)** - Source code and community contributions

## 🌐 Deployment

### Vercel (Recommended)

The easiest way to deploy is using the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) - created by the Next.js team.

For detailed deployment instructions, see the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).

---

**Built with ❤️ using Next.js**
