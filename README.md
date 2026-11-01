# Creator Engine Schedule

Dashboard for the schedules and trackers of the Creator Engine pods. Each pod lists its active shows, with links to the show's Tracker and Schedule documents.

Live site: https://creator-engine-schedule.vercel.app

## Files

| File | Purpose |
|---|---|
| `index.html` | Page markup and styles |
| `app.js` | Dashboard logic (pods, shows, document links) |
| `firebase-config.js` | Firebase web config (safe to be public; access is controlled by Firestore rules) |
| `seed-data.js` | Initial pod and show data |

## Run locally

This is a static site with no build step or dependencies. From this folder:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Deploy

The live site is hosted on Vercel.
