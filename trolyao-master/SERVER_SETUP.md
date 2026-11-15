# Server setup and deployment status

## Important: PostgreSQL is not integrated yet

The current application has no PostgreSQL schema, migration, database client, or database-backed account/game APIs. `DATABASE_URL` is not read by either server. Do **not** create a production database expecting the app to use it, and do not migrate or delete browser data. The database and centralized wallet/sync work remain incomplete.

The current browser backup tool is available at `data-backup.html`; create and securely store a backup before changing origins or attempting any future data migration. See [BACKUP_AND_RESTORE.md](./BACKUP_AND_RESTORE.md).

## Deploy the current backend to Render

The frontend currently targets `https://trolyao-51sj.onrender.com`. The backend that includes the optional Pusher routes is in `server/`; deploy that directory as the Render service root.

1. In Render, create a **Web Service** and connect this repository.
2. Set **Root Directory** to `server`.
3. Set **Build Command** to `npm install`.
4. Set **Start Command** to `npm start`.
5. Add the environment variables below in Render. Never commit their values.
6. Deploy and verify `https://<service>.onrender.com/health` returns JSON with `"ok": true`.

### Environment variables used by `server/server.js`

| Variable | Required | Purpose |
|---|---:|---|
| `OPENROUTER_API_KEY` | Yes for AI chat | OpenRouter credential; keep it only in Render/server environment settings. |
| `ADMIN_API_TOKEN` | Yes for admin actions | Long random secret required for Socket.IO kick, Pusher admin authorization, kick, and gift actions. The admin UI asks for it; it is not embedded in frontend code. |
| `ALLOWED_ORIGINS` | Recommended | Comma-separated exact browser origins, with no paths. Example: `https://lam187648.github.io,http://localhost:5500,http://127.0.0.1:5500`. |
| `OPENROUTER_MODEL` | No | Model identifier; defaults to `openai/gpt-4o-mini`. |
| `OPENROUTER_SITE_URL` | No | Site URL sent to OpenRouter for analytics. |
| `PUSHER_APP_ID` | Only for Pusher | Pusher application ID. |
| `PUSHER_KEY` | Only for Pusher | Pusher public application key. |
| `PUSHER_SECRET` | Only for Pusher | Pusher server-side secret. Never put this in frontend code. |
| `PUSHER_CLUSTER` | Only for Pusher | Pusher cluster, e.g. `ap1`. |
| `PORT` | Render-managed | Render supplies this. Do not hard-code it in Render settings. |

Use the same `ADMIN_API_TOKEN` in Render and when prompted by the admin interface. Generate a strong random value in a password manager or secret manager. Do not paste it into source files, issues, or chat. Configure the Pusher variables only if using Pusher; `PUSHER_KEY` and `PUSHER_CLUSTER` must match the public client configuration currently in `app.js` and `admin-panel.js`. The client-side key is public, but `PUSHER_SECRET` is not.

### Local backend

In PowerShell:

```powershell
Set-Location .\server
npm install
```

Make the required variables available in the process environment using Windows Environment Variables or your IDE's secret/environment settings, then run `npm start`. Neither server entrypoint currently loads `.env` automatically; `.env.example` is a reference template only. Do not put credentials in source files or commit them. The local backend listens on port `4000` unless `PORT` is set.

## Current API surface

| Endpoint/event | Access/behavior |
|---|---|
| `GET /` | Basic server response. |
| `GET /health` | Process health only; it does not check a database. |
| `POST /chat` | Validates message shape and limits request time; sends the request to OpenRouter using the server-side key. |
| `POST /pusher/user-online`, `POST /pusher/user-offline` | Presence signals; not account authentication. |
| `POST /pusher/auth` | Requires `ADMIN_API_TOKEN`; authorizes only the private admin channel. |
| `POST /pusher/kick`, `POST /pusher/gift-color`, `GET /pusher/users` | Require `ADMIN_API_TOKEN`. |
| Socket.IO `join`, `users` | Ephemeral presence only; submitted usernames and admin flags are not authenticated identities. |
| Socket.IO `kick` | Requires `ADMIN_API_TOKEN` in the event payload. |

This is **not** a PostgreSQL-backed API. Registration/login, profiles, account settings, token ledger, chat history, game progress, and garden state still use existing browser-side storage or are not centrally synchronized. `ADMIN_API_TOKEN` protects the listed admin operations; it is not a replacement for user authentication or authorization.

## Deployment and verification checklist

- [ ] Administrator creates the Render service and sets the environment variables.
- [ ] `/health` responds successfully after deployment.
- [ ] AI request is tested with a valid OpenRouter key; this may incur provider usage.
- [ ] Admin/Pusher behavior is tested only after setting the relevant server-side credentials.
- [ ] Camera permission, preview, tracking, camera loss, and cleanup are tested on a real supported device.
- [ ] PostgreSQL, database migrations, account APIs, centralized wallet, and multi-device sync are **not implemented or tested**.
- [ ] Browser backup is downloaded and stored securely before any future migration.

