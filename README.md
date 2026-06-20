<div align="center">
<img width="1200" height="475" alt="ChronoMap" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# ChronoMap

World time map + Discord timestamp generator. Live at https://www.chronomap.top

## Run locally

**Prerequisites:** Node.js 22+

1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev` → http://localhost:3000

No environment variables required.

## News ticker

The top **The Commons** ticker pulls the latest items from The Commons public JSON Feed
(`https://commons.now/feed.json`) through the `/api/news` same-origin proxy — no API key needed.
Override the source with the optional `COMMONS_FEED_URL` env var.

## Deploy

Hosted on Vercel, connected to this repo. Pushing to `main` triggers a production deploy.
