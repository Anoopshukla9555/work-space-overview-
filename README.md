# My Personal Space — Phase 1
Landing, auth (Google + email), purpose selection, dashboard.
1. `cd server && cp .env.example .env` (fill values) `&& npm i && npm run dev`
2. `cd client && cp .env.example .env` (add Google client id) `&& npm i && npm run dev`
Verification / reset emails are printed to the server console until you plug in SMTP (see `server/src/mail.js`).
Next phases: Shayari, Documents, Photos, Notes modules (Cloudinary/S3 uploads).
