# 🎬 RetroDex

> **Your Personal Movie Collection Manager.**
> Discover, catalog, and track your film journey with a modern, secure, and beautiful interface.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE.md)
[![Next.js](https://img.shields.io/badge/Next.js-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-%2320232a.svg?logo=react&logoColor=%2361DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=fff)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-%2338B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000?logo=shadcnui&logoColor=fff)](https://ui.shadcn.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase&logoColor=fff)](https://supabase.com/)
[![Lucide](https://img.shields.io/badge/Lucide_Icons-F05032?logo=lucide&logoColor=white)](https://lucide.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-6DA55F?logo=node.js&logoColor=white)](https://nodejs.org/en)
[![TanStack Query](https://img.shields.io/badge/TanStack_Query-FF4154?logo=reactquery&logoColor=white)](https://tanstack.com/query/latest)

## 🌐 Live Demo

🚀 **[RetroDex](https://retro-dex.vercel.app/)**

---

## 📖 Table of Contents

1. [Project Description](#-project-description)
2. [Key Features](#-key-features)
3. [Tech Stack](#-tech-stack)
4. [Architecture & Security](#-architecture--security)
5. [Installation & Setup](#-installation--setup)
6. [Folder Structure](#-folder-structure)
7. [The Team](#-developers)
8. [License](#-license)

---

## 📝 Project Description

**RetroDex** is a “Collectors Special Edition” web application that helps cinephiles catalog, track, and analyze their personal movie collections.
It solves the problem of scattered movie lists by providing a centralized, private database for your collection, enriched with public data from TMDB.

---

## ✨ Key Features

- **🔍 Secure Discovery:** Search for movies using the TMDB API. All requests are proxied through **Supabase Edge Functions** to keep API keys 100% secure.
- **📂 Private Collection:** Add movies to your personal library with statuses: `Wishlist`, `Owned`, or `Watched`.
- **⭐ Rich Metadata:** Rate movies, write private reviews, and track the **estimated value** of your collection.
- **📊 Dashboard Analytics:** Visualize your viewing habits with dynamic charts (Movies watched this year, Top Genres, Collection Value).
- **🎨 Custom Posters:** Don't like the official poster? Upload your own custom cover art for any movie in your collection.
- **📥 Data Export:** Export your entire catalog to **PDF**, **CSV**, or **JSON** for backups or sharing.

---

## 🛠 Tech Stack

### Core Framework

- **Next.js (App Router)** - Server-side rendering capabilities, routing, and simplified API handling.
- **React** - Interactive UI components and managing client-side state.
- **TypeScript** - Type safety across the application, reducing runtime errors.

### UI & Styling

- **Tailwind CSS** - Utility-first for styling, allowing for rapid UI development.
- **shadcn/ui** - Re-usable components built using Radix UI and Tailwind CSS.
- **Lucide React** - Icon library used throughout the application interface.

### Backend & Data

- **Supabase** - Complete backend-as-a-service (BaaS). Handles Authentication, the PostgreSQL database, and Storage for user uploads.
- **Node.js** - Execute server actions, route handlers and middleware.
- **TanStack Query (React Query)** - Manages server state in the frontend. It handles data fetching, caching, synchronization, and updating UI state when data changes.

### Utilities

- **Charts:** `recharts` (for Dashboard analytics)
- **Dates:** `date-fns`
- **Export:** `jspdf` (PDF), `papaparse` (CSV)

---

## 🔒 Architecture & Security

RetroDex employs a **Hybrid Architecture** to ensure security and performance.

### 1. The Secure Proxy (Edge Functions)

We do not expose the TMDB API Key in the frontend. Instead, we use a **Supabase Edge Function** (`search-tmdb`) as a proxy.

- **Flow:** Client → Edge Function (validates user session) → TMDB API (adds secret key) → Client.
- **Endpoints:** Supports `search`, `popular`, `top_rated`, and `upcoming`.

### 2. Row Level Security (RLS)

Every table in our PostgreSQL database (`profiles`, `movies`) has strict RLS policies enabled.

- Users can **only** read, update, or delete data linked to their specific `user_id`.
- Storage buckets (`profile-pictures`, `movie-posters`) use policy-based security to ensure users can only modify their own uploaded files.

---

## 💻 Installation & Setup

Follow these steps to run RetroDex locally.

1. **Clone the repository**

   ```bash
   git clone https://github.com/gustavo2023/retro-dex.git
   cd retro-dex
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env.local` file in the root directory and add your keys:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Open the app**
   Visit `http://localhost:3000` in your browser.

---

## 📂 Folder Structure

```bash
retro-dex/
├── public/
├── src/
│   ├── app/
│   │   ├── (app)/
│   │   │   ├── dashboard/
│   │   │   ├── discover/
│   │   │   ├── settings/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── (auth)/
│   │   ├── auth/
│   │   │   └── confirm/
│   │   ├── error/
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/
│   │   └── ui/
│   ├── hooks/
│   ├── lib/
│   ├── middleware.ts
│   └── utils/
│       └── supabase/
├── supabase/
│   ├── .temp/
│   ├── config.toml
│   └── functions/
│       └── search-tmdb/
├── README.md
├── package.json
└── next.config.ts
```

---

## 👥 Developers

- Gustavo Gutiérrez – [@gustavo2023](https://github.com/gustavo2023)
- Jesús Rivas – [@rivas1731](https://github.com/rivas1731)
- Adriano Robati – [@AdrianoR05](https://github.com/AdrianoR05)

## 📄 License

This project is licensed under the [MIT License](LICENSE.md).
