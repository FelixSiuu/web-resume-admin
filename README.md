# Felix Siu Admin System

Admin system for managing resume content, including About Me, Core Skills, Working Experience, Education, Contact, Projects, and PDF export.

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
- `/forgot-password`: request a reset link with registration email + captcha; prompt is `BaseVo.message`; cooldown seconds come from `data.cd` on both HTTP 200 and HTTP 4xx (`data === null` is a captcha error: refresh captcha, no countdown)
- `/reset-password`: email link `?token=`; validates the token on entry, then shows the new-password form
- `/verify-email`: email link `?token=` confirms the address
- `/overview/aboutme`
- `/overview/coreskills`
- `/overview/workingexperience`
- `/overview/education`
- `/overview/contact`
- `/overview/projects`: project list (drag reorder; grouping disables reorder)
- `/overview/projects/new`: create project
- `/overview/projects/[slug]`: edit project (slug is editable)
- `/overview/export-pdf`

## API responses

- HTTP 2xx is success. The body is `BaseVo` (`isSuccess`, `code`, `message`, `data`). The Axios success interceptor returns `response.data` and does not reshape it.
- Every other error is HTTP 4xx. The body is also `BaseVo`, carried on `error.response.data`. The client reads `message`, and `data` when it is present. Success and error copy shown in the UI come from that `message`.
- HTTP 401 and 403 are not turned into page-level business results. The interceptor calls `handleUnauthorized()`, which redirects to `/login`. A business API 401 tries `POST /auth/refresh` once first; the redirect happens when that refresh fails, and it happens immediately for auth routes, requests with `skipAuthRefresh`, and every 403.
- Only `POST /auth/forgot-password` returns `CoolDownVo` (`{ cd: number }`, seconds) on both HTTP 200 and HTTP 4xx. The submit and resend countdown uses `data.cd`. When cooldown data is absent, the client does not invent a duration. Other endpoints do not return `CoolDownVo`.

## Auth & Routing Notes

- Root path `/` and `/overview` redirect to `/overview/aboutme` via `src/proxy.ts` (route-only; no cookie gate). `/login`, `/verify-email`, `/forgot-password`, and `/reset-password` stay public.
- `/reset-password` calls `POST /auth/validate-reset-token` on entry. An expired or invalid token shows `message` and links back to `/forgot-password`. Submitting a new password uses `POST /auth/reset-password`.
- Auth cookie `ACCESS_TOKEN` is HttpOnly on the API origin (`SameSite=None; Secure; Path=/`). Frontend and API are cross-origin; the Next app never reads this cookie.
- Axios uses `withCredentials: true` so browser sends `ACCESS_TOKEN` on API calls.
- CSRF (double-submit): API still sets `XSRF_TOKEN` cookie (browser sends it with credentials). Because cross-origin JS cannot read that cookie, `LoginVo.xsrfToken` is stored in Zustand (persisted) and sent as header `Xsrf-Token` on POST/PUT/DELETE. Cookie `document.cookie` is only a same-site / localhost fallback.
- Auth enforcement: business API 401 → `POST /auth/refresh` once (shared in-flight promise), update Zustand `xsrfToken`/`username`, retry original request. Refresh / auth-route 401 or 403 → clear Zustand user + xsrfToken → redirect `/login`.
- Successful login navigates to `/overview/aboutme`.
