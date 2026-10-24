# Veo — video streaming

Minimal dark UI. React + Vite + Tailwind v4 frontend, Express + MongoDB (GridFS) backend.

## Run
1. Start MongoDB locally, then copy `backend/.env.example` to `backend/.env`.
2. Backend: `cd backend`, `npm install`, then `npm run dev` (http://localhost:3000).
3. Frontend: copy `.env.example` to `.env.local`, then run `npm install` and `npm run dev` (http://localhost:5173).

Set `MONGO_URI` for the backend and `VITE_API_URL` for the frontend when using non-default URLs.

## Deploy

1. Deploy the repository's `render.yaml` as a Blueprint on Render. In the backend service's environment settings, set `MONGO_URI` to your MongoDB Atlas connection string. Keep it in Render's secret environment settings; do not commit it.
2. Deploy the repository root as a Vite project on Vercel with the default `npm run build` build command and `dist` output directory.
3. In Vercel's project environment variables, set `VITE_API_URL` to the Render backend URL (for example, `https://veo-backend.onrender.com`), then redeploy the frontend.
4. In MongoDB Atlas Network Access, allow connections from Render. For production, prefer Render's outbound IP addresses where available instead of allowing access from everywhere.

If a database password or connection string has been shared publicly, rotate it in Atlas and use the new connection string in Render.

## Shortcuts (player)
Space/K play · ←/→ ±5s · J/L ±10s · M mute · F fullscreen · T theater · `/` search
