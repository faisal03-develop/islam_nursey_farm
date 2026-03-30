# 🌿 Islam Nursery Farm

Welcome to the Islam Nursery Farm full-stack web application! This project is built using:
- **Next.js 15 (App Router)** for Server-Side Rendering (SSR) and Server Actions.
- **Prisma 7** as the ORM.
- **PostgreSQL** as the database.
- **Vanilla CSS** for a premium, nature-inspired design.

## Features
- **SSR Catalog**: Fetches the latest plants directly from the database on every page load.
- **Server Actions**: Securely add new plants to the catalog without reloading the page.
- **Premium UI**: Modern aesthetics with glassmorphism, responsive triggers, and smooth transitions.
- **Nature Theme**: Curated CSS palette using greens and earthy tones.

## Getting Started

### 1. Database Configuration (CRITICAL for Prisma 7)
Prisma 7 has introduced a new configuration pattern.
1. Update the `DATABASE_URL` in your `.env` file with your PostgreSQL connection string:
   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
   ```
2. The database connection is handled in `prisma.config.ts` (new in Prisma 7).

### 2. Push Schema to Database
Once you've set your `DATABASE_URL`, run:
```bash
npx prisma db push
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Explore
Open [http://localhost:3000](http://localhost:3000) to see your premium Nursery Farm dashboard!

## Project Structure
- `app/page.tsx`: Main SSR page displaying the plant list.
- `app/AddPlantForm.tsx`: Interactive form for adding new plants.
- `app/actions.ts`: Server Actions for database mutations.
- `lib/prisma.ts`: Prisma Client singleton.
- `prisma/schema.prisma`: Database model definitions.
- `prisma.config.ts`: Prisma 7 configuration file.
