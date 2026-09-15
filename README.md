# Felix Siu Admin System

Admin system for managing resume content, including About Me, Core Skills, Working Experience, Education, Contact, and PDF export.

## Tech Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Ant Design 6 + Tailwind CSS 4
- React Query + Axios
- Zustand (auth user persistence)

## Prerequisites

- Node.js 20+
- npm 10+

## Environment Variables

Create `.env.development` for local development:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

The frontend API base URL is resolved as:

```text
${NEXT_PUBLIC_API_BASE_URL}/api/v1
```

## Install

```bash
npm install
```

## Run

```bash
npm run dev
```

Open: [http://localhost:3000](http://localhost:3000)

## Build & Lint

```bash
npm run lint
npm run build
```

## Tests

```bash
npm run test
```

## Main Routes

- `/login`: login, captcha, register modal
- `/overview/aboutme`
- `/overview/coreskills`
- `/overview/workingexperience`
- `/overview/education`
- `/overview/contact`
- `/overview/export-pdf`

## Auth & Routing Notes

- Root path `/` redirects to `/overview` via `src/proxy.ts`.
- If `token` cookie is missing, access to `/overview*` redirects to `/login`.
- API 401 responses clear auth session and redirect to `/login`.
