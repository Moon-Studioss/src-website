# SRC e-solutions

Website for **SRC e-solutions**, a studio that builds final-year and mini projects for engineering students and sells the electronics parts those projects need.

## What the site does

- **Project ideas.** The home page has a hands-on "student bench": plug a wire into your branch (CSE, IT, ECE, EEE, Mech), press the button, and get a real project idea you can ask us to build.
- **Submit a project.** A short guided form for students to describe their project, pick a deadline, and attach a file. Each request gets a reference code.
- **Track a project.** Students check the status of their request with that reference code.
- **Parts store.** Browse electronics parts by category, search, add to a cart, and send the order on WhatsApp. There is no online payment: price, delivery and payment are confirmed in the chat. Some products include a downloadable product document.
- **Admin panel.** A private dashboard for the owner to manage project requests, products, categories and site settings.

## Tech stack

- [Next.js](https://nextjs.org) (App Router) with React and TypeScript
- Tailwind CSS, with a few shadcn/ui components
- PostgreSQL with [Drizzle ORM](https://orm.drizzle.team)
- [Uploadthing](https://uploadthing.com) for file and photo uploads
- [Resend](https://resend.com) for email notifications
- Framer Motion for animation
- Deployed on Vercel

## Running it locally

You need Node.js 20 or newer and a PostgreSQL database.

```bash
npm install
cp .env.example .env.local   # then fill in your own values
npm run db:push              # create the tables in your database
npm run dev                  # http://localhost:3000
```

### Environment variables

Copy `.env.example` to `.env.local` and fill in your own values. `.env.local` is git-ignored, so never commit it.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Lint the code |
| `npm run db:push` | Sync the schema in `src/lib/db/schema.ts` to the database. Review what it plans to do, and never run it with `--force` on a database that holds real data. |
| `npm run db:studio` | Browse the database in Drizzle Studio |

Quick self-checks for the pure helpers (no test framework needed):

```bash
node src/lib/store.check.ts
node src/lib/ideas.check.ts
```

## Project layout

```
src/
  app/
    (public)/      public pages: home, submit, status, store
    api/           upload, clean-up and pincode endpoints
  components/      shared UI
  lib/             database, auth, email, store and idea helpers
public/            images served as-is
```

## Security

Please don't open public issues for security problems. Contact the maintainers privately instead.
