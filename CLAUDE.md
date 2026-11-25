# CLAUDE.md: Creator Engine Schedule (Active Shows Overview)

## What this is
A static dashboard for Sreenjoy Dey (Creative Head, Non-Fiction, Creator Engine). It lists the active shows for each pod, with a Tracker and a Schedule link per show, and shows a banner and logo per show.

- Live site: https://creator-engine-schedule.vercel.app (Vercel, public, no login)
- Repo: https://github.com/sreenjoyd/creator-engine-schedule
- Pushing to `main` redeploys the live site. Don't push to `main` without Sreenjoy's OK in chat.

## Files
| File | Purpose |
|---|---|
| `index.html` | Markup and styles, including the Manage pods panel |
| `app.js` | Reads and writes Firestore, renders pods and shows, Manage pods logic |
| `theme.js` | Theme picker: six palettes plus light, dark and auto modes, saved per browser |
| `firebase-config.js` | Firebase web config. Public by design; access is controlled by Firestore rules |
| `seed-data.js` | Starting data, `window.SEED_SHOWS`. Used only when the `shows` collection is empty |
| `img/` | Banner and logo files referenced by `seed-data.js` |

## Data lives in Firestore, not in the repo
- Collection: `shows`. Document id is the show id.
- Fields: `name`, `producer` (Pranav, Newel, Nilaj, Rahul, or Limited Series), `cp` (creative producer, Limited Series only), `type` (`main` or `shorts`), `tracker` and `schedule` (URLs), `image` and `logo` (data URLs uploaded in the app), `order`.
- Editing happens in the live app: Manage pods, or click a show's card while the panel is open.
- Changing `seed-data.js` does not change the live site. The seed only fills an empty collection.
- Uploaded images are stored as data URLs inside the Firestore document, capped at 700 KB each (Firestore's per-document limit is 1 MiB).

## Manage pods panel
- Shows are grouped under pod headings in pod order.
- Each show has: Project name, Change banner image, Change logo, creative producer (Limited Series only), Tracker link and Schedule link.
- Save changes writes only the fields that changed, as one batch.

## Rules from Sreenjoy's workspace (CLAUDE.md in the main folder)
- Drafts only. Don't send, share, post or delete anything without his OK in chat.
- Murdoch Mysteries and A Roadmap to Happiness are limited series. They don't belong in active lists.
- The final Roadmap schedule (16 Nov) is the only source of truth for its dates. Only Sreenjoy changes shared schedules.
- Spelling: the show is "Hizzouse", not "Hizzouze".
- The org chart is the source of truth for people and pods.

## Known items
- Mark Wiens Documentary banner (`img/markwiens-documentary-banner.jpg`) is a Wikimedia Commons photo, CC BY 3.0, with a "GO NEXT" watermark. Credit is needed if the page is shared more widely.
- Logos for Hizzouse and Le Frenchies are still missing.

## Running locally
Static site, no build step:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.
