# Beautywerk

## Run locally

Install dependencies and start both the Vite frontend and the Express API:

```sh
npm install
npm run dev
```

The frontend runs on Vite's local URL and proxies `/api` requests to the API on
port `3001`. SQLite creates `server/data/beautywerk.sqlite` on first run.
Set `DATABASE_PATH` to use a different database file.

## Production

Build the frontend and start the Express server, which serves both the API and
the generated site:

```sh
npm run build
npm start
```

The server listens on port `3001` by default. Set `PORT` to change it. Use a
persistent disk for `DATABASE_PATH` when deploying; the SQLite file must survive
server restarts and releases.

## Admin

The Express server loads `ADMIN_TOKEN` from the ignored `.env` file in the
project root (or from the process environment). Keep this value secret, never
put it in frontend environment variables, and do not commit it to source
control. To inspect the local token in PowerShell, run this from the project
root:

```powershell
Get-Content .env
```

Open `/admin` and enter the `ADMIN_TOKEN` value. The admin workspace keeps it
in the current browser session only and manages bookings and review moderation,
treatment catalog and prices, gallery items, and business hours, all stored in
SQLite. The API refuses admin requests when `ADMIN_TOKEN` is not configured.

## API

- `GET /api/health` checks server availability.
- `GET /api/reviews` returns saved public reviews.
- `POST /api/reviews` validates and saves a review.
- `POST /api/bookings` validates and saves an appointment request.
- `GET /api/bookings` returns the latest appointment requests and requires
  `Authorization: Bearer <ADMIN_TOKEN>`. Set `ADMIN_TOKEN` in the server
  environment; without it, booking management stays unavailable.

Booking requests are saved for the studio to review. The API does not send
confirmation emails or automatically confirm appointments.

Run API tests with `npm test`.