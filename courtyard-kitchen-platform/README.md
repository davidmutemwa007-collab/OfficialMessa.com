# The Courtyard Kitchen — full-stack ordering & restaurant workspace

A responsive restaurant website and operations workspace built around the supplied food photography, burger video, and music assets. The design takes cues from the supplied UI screen recordings (animated registration panel, pill-shaped navigation, geometric detail and compact media cards) without publishing those screen recordings as website content.

## What is included

- **Customer website:** rotating image-led hero, video feature, responsive menu/catalogue, category filters, search, basket, pickup/delivery checkout, QR payment option, table reservations and a customer workspace.
- **Owner/admin workspace:** daily overview, order management, reservation management, menu/product creation and editing, product image upload, staff account creation, restaurant details, payment QR upload and password changes.
- **Role-based staff workspaces:** cooks see active kitchen tickets; delivery staff see ready/in-progress delivery tickets; waiters see today's table reservations and can confirm/seat/complete guests.
- **API:** Node.js + Express + PostgreSQL, JWT sessions, bcrypt password hashing, rate-limited sign-in, role checks, database migrations and seed data.
- **Deployment:** Vercel frontend, Render API + Postgres, and a GitHub Pages workflow for the same static frontend.

## Project structure

```text
courtyard-kitchen-platform/
├── .github/workflows/deploy-pages.yml
├── backend/
│   ├── src/db.js
│   ├── src/migrate.js
│   ├── src/server.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── public/assets/images/     # Supplied food, drinks and venue photography
│   ├── public/assets/video/      # Supplied burger cinematic video
│   ├── public/assets/audio/      # Supplied music files
│   ├── src/App.jsx
│   ├── src/api.js
│   ├── src/main.jsx
│   ├── src/styles.css
│   ├── package.json
│   ├── vercel.json
│   └── vite.config.js
├── design-references/            # Supplied UI inspiration videos (not loaded by the live site)
├── docker-compose.yml
├── render.yaml
└── package.json
```

## Initial owner access

The first database migration creates the owner account when it does not already exist:

- **Email:** `davidmutemwa007@gmail.com`
- **Starter password:** `admin1234`

**Change this password immediately after your first login** from **Workspace → Settings → Change your password**. The owner account is seeded only when the email is not already in the database; later deployments do not reset an existing password. Staff accounts are created by the owner under **Workspace → Team access**. Choose `Cook / kitchen`, `Delivery person`, or `Table reservations / waiter`; that role determines which workspace they see after sign-in.

## Local development

Requirements: Node.js 20+ and Docker Desktop (or another PostgreSQL 16+ database).

1. Start PostgreSQL from the project root:

   ```bash
   docker compose up -d db
   ```

2. Install the workspace dependencies:

   ```bash
   npm install
   ```

3. Create the backend environment file:

   ```bash
   cp backend/.env.example backend/.env
   ```

   The example `.env` uses the included Docker database credentials. Change `JWT_SECRET` to a long random secret before using real customer data.

4. Create the tables and starter menu, then launch the API:

   ```bash
   cd backend
   npm run migrate
   npm run dev
   ```

   The API health check is `http://localhost:4000/api/health`.

5. In a second terminal, launch the website:

   ```bash
   cd frontend
   cp .env.example .env
   npm run dev
   ```

   Open `http://localhost:5173`.

The `VITE_API_URL` value is compiled into the browser app. Keep it set to `http://localhost:4000` for local development and change it to your public Render API URL for deployments.

## Deploy the backend to Render

The included `render.yaml` defines a Node web service and a managed PostgreSQL database. In Render:

1. Push this project to a GitHub repository.
2. In Render choose **New → Blueprint**, connect the repository and apply `render.yaml`.
3. The Blueprint creates `courtyard-kitchen-api` and `courtyard-kitchen-db`. The service runs the idempotent database migration before starting Express.
4. In the API service environment, set `CLIENT_URL` to your Vercel production origin and any custom frontend origin you use. Multiple comma-separated origins are supported. The `.vercel.app` and `.github.io` hostnames are also allowed by the API CORS policy.
5. Keep the generated `JWT_SECRET` private. Set a different `ADMIN_PASSWORD` before the database is first seeded if you prefer not to use the requested starter password. If the owner account already exists, changing that environment variable does not reset it; use the in-app password change instead.
6. Once the service is live, open `https://YOUR-API.onrender.com/api/health` and confirm it returns `{"status":"ok", ...}`.

The API stores menu and QR image uploads as image data in PostgreSQL, so they survive ordinary Render restarts and deploys. For a large, production-scale catalogue, move uploads to an object store (for example Cloudinary or S3) rather than storing many multi-megabyte images in database rows.

**Payment note:** QR checkout displays the owner's uploaded QR image and payment instructions. It does not automatically contact a mobile-money or card processor. The owner verifies the transfer and marks the order as paid from the Orders workspace. Connect a provider-specific payment API and webhook before treating payments as automatically confirmed.

**Hosting cost note:** The included Blueprint selects Render's Starter web-service tier and Basic-256mb Postgres tier. Render currently lists those at about **US$7/month + US$6/month** respectively, before any bandwidth or extra storage; prices and plan names can change, so review [Render's current pricing](https://render.com/pricing) before applying the Blueprint.

## Deploy the frontend to Vercel

1. Import the GitHub repository in Vercel.
2. Set the **Root Directory** to `frontend`.
3. Vercel should detect Vite. Use build command `npm run build` and output directory `dist` if asked.
4. Add the environment variable `VITE_API_URL` with the public Render API origin, for example `https://courtyard-kitchen-api.onrender.com` (no trailing slash).
5. Deploy. The `frontend/vercel.json` file includes the SPA fallback rewrite.

For a custom frontend domain, add that origin to Render's `CLIENT_URL` as well.

## Deploy the same frontend to GitHub Pages

GitHub Pages can host the **static frontend only**. It cannot run this Express API or PostgreSQL database; keep the API on Render.

1. In the GitHub repository, open **Settings → Pages** and choose **GitHub Actions** as the build/deployment source.
2. Under **Settings → Secrets and variables → Actions → Variables**, create a repository variable named `VITE_API_URL` and set it to your Render API origin.
3. Push to the `main` branch (or run **Deploy frontend to GitHub Pages** manually from Actions).
4. The included workflow builds Vite with the repository sub-path as its base URL and deploys `frontend/dist`.

The app uses hash-based client-side navigation so links also work on GitHub Pages. If you use both Vercel and Pages, they can point to the same Render API.

## Staff workflow

| Role | What they can see and do |
|---|---|
| Owner / admin | Overview, all orders, all reservations, menu and product editing, staff access, QR payments, restaurant settings and password change |
| Cook | Kitchen queue; accept a new ticket, start preparation and mark it ready |
| Delivery | Delivery tickets; mark a ready order as picked up and then delivered |
| Waiter | Today's reservations; confirm the booking, mark guests seated and complete the visit |
| Customer | Own order and reservation history |

Staff members sign in from the normal **Sign in** panel with the account the owner creates. Their role is read from the database; it is not selected by the browser.

## Assets and music note

The original JPGs, burger promo MP4 and two supplied MP3 files are included in `frontend/public/assets`. The five UI reference MP4s are kept in `design-references/` for reference and are not loaded by the public page. The background tracks only play after a visitor presses the music controls, respecting browser autoplay restrictions.

Before making the site public, make sure you have the rights to publish and stream every supplied music track. In particular, the file named `Tell Me It's You` appears to be a commercial soundtrack recording; having the file in the asset pack does not itself grant web-publication rights. Remove that track from `frontend/public/assets/audio` and the `MusicDock` list if you do not hold the required licence.

## Production checklist

- Replace the sample phone number/address in Workspace → Settings.
- Change the starter owner password immediately.
- Create individual staff accounts and share their passwords privately.
- Configure the real QR payment image and instructions.
- Set `VITE_API_URL` on Vercel and as the GitHub Actions repository variable.
- Set `CLIENT_URL` on Render for any custom site origin.
- Ensure the music and imagery are licensed for public web use.
- Use a private GitHub repository until starter secrets have been replaced. Never commit `.env` files.

## Important deployment note

Vercel and GitHub Pages are alternative hosts for the same static frontend. You do not need to deploy the frontend to both, but can do so if you want two public entry points. Render hosts the API and database. The web app is designed for that split: all customer and staff data operations call `VITE_API_URL`, while the public images, videos and audio are served by the frontend host.
