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

- Root path `/` and `/overview` redirect to `/overview/aboutme` via `src/proxy.ts` (route-only; no cookie gate).
- Auth cookie `ACCESS_TOKEN` is HttpOnly on the API origin (`SameSite=None; Secure; Path=/`). Frontend and API are cross-origin; the Next app never reads this cookie.
- Axios uses `withCredentials: true` so browser sends `ACCESS_TOKEN` on API calls.
- Auth enforcement: API returns 401 → clear Zustand user → redirect `/login`.
- Successful login navigates to `/overview/aboutme`.
