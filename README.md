# RetroDex

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

## Live Demo

[RetroDex](https://retro-dex.vercel.app/)

## Table of Contents

1. [Project Description](#project-description)
2. [Tech Stack](#tech-stack)
3. [Installation](#installation)
4. [Folder Structure](#folder-structure)
5. [Environment & TMDB Usage](#environment--tmdb-usage)
6. [Developers](#developers)
7. [License](#license)

## Project Description

RetroDex is a “Collectors Special Edition” web application that helps cinephiles catalog, track, and analyze their personal movie collections. Users can:

- Discover movies securely via The Movie Database (TMDB) through Supabase Edge Functions.
- Add TMDB titles to their private collection with a default `wishlist` status.
- Manage custom metadata such as reviews, ratings, status, and estimated value stored in Supabase Postgres with Row Level Security.
- Visualize collection data through dashboards and curated featured sections (Popular, Top Rated, Upcoming).

## Tech Stack

- **Framework**: Next.js (App Router) + TypeScript
- **UI**: Tailwind CSS + shadcn/ui + Lucide icons
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **State / Data**: Supabase clients (`@supabase/ssr` helpers)
- **Notifications**: Sonner
- **API**: TMDB (proxied through Supabase Edge Functions)

---

## Installation

```bash
git clone https://github.com/gustavo2023/retro-dex.git
cd retro-dex
npm install

npm run dev
```

> The app runs on <http://localhost:3000> by default.

---

## Folder Structure

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

## Environment & TMDB Usage

- All TMDB requests flow through the Supabase Edge Function `search-tmdb`, ensuring the TMDB API token never reaches the client.

- The Edge Function supports the following endpoints via the `endpoint` body field: `search`, `popular`, `top_rated`, `upcoming`.

---

## Developers

- Gustavo Gutiérrez – [@gustavo2023](https://github.com/gustavo2023)
- Jesús Rivas – [@rivas1731](https://github.com/rivas1731)
- Adriano Robati – [@AdrianoR05](https://github.com/AdrianoR05)

## License

This project is licensed under the [MIT License](LICENSE.md).
