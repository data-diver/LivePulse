# Real-Time Response Collection Platform

A lightweight web app for running live interactive sessions — Q&A, feedback rounds, brainstorming, or opinion polls during events and workshops. Participants submit responses via their mobile, a moderator approves what gets shown, and approved responses appear live on a presentation screen with audience upvoting.

---

## How It Works

The app has three separate views:

| Route | Who uses it | What it does |
|-------|-------------|--------------|
| `/` | Presenter / big screen | Displays approved responses live with like counts |
| `/admin` | Moderator | Reviews, approves, or rejects incoming responses |
| `/mobile` | Participants | Submits responses via QR code link |

The moderator configures the session title and subtitle from the admin settings panel, which sets the context for participants (e.g. "What's your biggest challenge with AI?" vs "Submit your questions"). All three views stay in sync in real time via WebSockets.

---

## Getting Started

### Prerequisites

- Node.js 18+
- A PostgreSQL database (e.g. [Neon](https://neon.tech) for a free hosted option)

### Setup

```bash
git clone <your-repo-url>
cd <repo-folder>
npm install
```

Create a `.env` file in the root:

```env
DATABASE_URL=postgresql://user:password@host/dbname
```

Push the database schema:

```bash
npm run db:push
```

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5000`.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |

> Note: The app runs on in-memory storage by default during development. `DATABASE_URL` is required for `npm run db:push` and production use.

---

## Tech Stack

**Frontend**
- React + TypeScript (Vite)
- TanStack Query for data fetching
- shadcn/ui + Tailwind CSS
- Wouter for routing

**Backend**
- Node.js + Express
- WebSocket server (`ws`) for real-time updates
- Drizzle ORM + PostgreSQL (Neon)
- Zod for validation

---

## Running a Session

1. Open `/admin` on your device and click the settings icon to set your session title and subtitle
2. Share the `/mobile` URL or QR code with participants
3. Display `/` on the main screen or projector
4. As responses come in, approve them from the admin panel — they appear on the main screen instantly
5. When the session ends, use "Clear All Responses" in settings to reset for the next session

---

## Project Structure

```
├── client/src/
│   ├── pages/
│   │   ├── main.tsx        # Main presentation screen
│   │   ├── admin.tsx       # Moderator panel
│   │   └── mobile.tsx      # Participant submission view
│   └── components/
│       └── ui/             # shadcn/ui components
├── server/
│   ├── index.ts            # Express server entry point
│   ├── routes.ts           # API routes + WebSocket server
│   └── storage.ts          # Storage interface + in-memory implementation
├── shared/
│   └── schema.ts           # Shared TypeScript types + Drizzle schema
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/questions/approved` | Fetch approved responses |
| GET | `/api/questions/pending` | Fetch pending responses (admin) |
| POST | `/api/questions` | Submit a new response |
| PATCH | `/api/questions/:id/status` | Approve or reject a response |
| POST | `/api/questions/:id/like` | Upvote a response |
| GET | `/api/stats` | Session statistics |
| GET | `/api/event-settings` | Current session title/subtitle |
| PUT | `/api/event-settings` | Update session title/subtitle |
| DELETE | `/api/questions` | Clear all responses |

---

## Deployment

The app builds to a single Node.js server that serves both the API and the frontend static files.

```bash
npm run build
npm start
```

Set `DATABASE_URL` as an environment variable in your hosting environment.
