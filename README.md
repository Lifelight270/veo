# Lumen — video streaming

Minimal dark UI. React + Vite + Tailwind v4 frontend, Express + MongoDB (GridFS) backend.

## Run
1. Start MongoDB locally (`mongodb://localhost:27017`).
2. Backend:  `cd backend && npm install && npm run dev`   (http://localhost:3000)
3. Frontend: `npm install && npm run dev`                  (http://localhost:5173)

Set `VITE_API_URL` if the backend is not on http://localhost:3000.

## Shortcuts (player)
Space/K play · ←/→ ±5s · J/L ±10s · M mute · F fullscreen · T theater · `/` search
