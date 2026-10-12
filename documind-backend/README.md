# DocuMind Backend

DocuMind is an AI assistant that answers questions from an organization's own
documents (RAG) and can take actions such as creating support tickets.
This repository is the backend. **Story 1** is the foundation: a validated,
observable TypeScript/Express skeleton with nothing AI-specific yet.

## Requirements

- Node.js 20 or newer

## Setup

```bash
npm install
cp .env.example .env     # then edit values if needed
npm run dev              # starts with auto-reload
```

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Run with auto-reload (tsx watch) |
| `npm run typecheck` | Strict TypeScript check, no output |
| `npm run build` | Compile to `dist/` |
| `npm start` | Run the compiled build (production) |

## Configuration

All config comes from environment variables, validated at startup in
`src/config/env.ts`. If anything is missing or invalid the app exits with a
readable message. See `.env.example`.

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | yes | Port to listen on |
| `NODE_ENV` | no | `development` (default), `test`, `production` |
| `LOG_LEVEL` | no | `info` (default), `debug`, `warn`, ... |

## Endpoints

| Method | Path | Description |
| --- | --- | --- |
| GET | `/health` | `{ "status": "ok", "uptime": 12, "timestamp": "..." }` |

Errors always return JSON: `{ "error": { "code", "message", "requestId" } }`.
Stack traces are only included outside production.

## Structure

```
src/
├── config/        env loading + validation (the only place process.env is read)
├── routes/        URL definitions only
├── controllers/   read request, call service, send response
├── services/      business logic (no Express types)
├── middlewares/   not-found handler, central error handler
├── utils/         logger, AppError
├── app.ts         builds the Express app (no listening, so it is testable)
└── server.ts      starts listening, handles graceful shutdown
```

## Design notes

- Every request gets an `x-request-id` (reused if the caller sends one) that
  appears in logs and error responses.
- Logs are structured JSON in production, pretty-printed in development.
- `SIGTERM`/`SIGINT` trigger a graceful shutdown (in-flight requests finish).
