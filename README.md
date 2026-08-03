# Seva Board — HKM Vizag

Temple seva task board. Next.js 14 (App Router) + MongoDB, deployed on **Railway**
(also works on Coolify or anywhere else that runs a Dockerfile).

The whole board (sevas, team, festivals, tasks) is stored as one MongoDB document and shared
live across everyone who opens the site. Personal preferences (who you are, evening mode) stay
in the browser.

---

## Deploy on Railway

1. Push this folder to a Git repo (GitHub org `HkmVizagTech`).
2. In Railway: **New Project → Deploy from GitHub repo** → select it. Railway auto-detects
   `railway.toml` and builds the included `Dockerfile` — no config needed.
3. Add MongoDB: in the same project, **+ New → Database → Add MongoDB** (from Railway's
   template marketplace). It provisions a Mongo service and exposes a connection variable
   (usually `MONGO_URL` on that service).
4. On the **app service → Variables**, add:
   - `MONGODB_URI` → click **"Add Reference"** and point it at the Mongo service's
     `MONGO_URL` (keeps it in sync automatically), or paste the connection string directly.
   - `MONGODB_DB=sevaboard`
   - `BOARD_PASSWORD` = a shared team passcode (optional — see below)
   - The Microsoft email variables (see **Email notifications** below)
5. **Settings → Networking → Generate Domain** for a free `*.up.railway.app` URL, or attach
   your own domain (e.g. `seva.hkmvizag.org`) with a CNAME.
6. Deploy. Railway injects `PORT` automatically at runtime — the standalone Next server
   already reads `process.env.PORT`, so no changes are needed. Railway's healthcheck hits
   `/api/health` (see `railway.toml`), which works even when `BOARD_PASSWORD` is set,
   since that route isn't gated.

## Alternative: self-host on Coolify

The same Dockerfile works unchanged on Coolify. Two options, both on port **3000**:

**App container + MongoDB Atlas** — Coolify only runs the app: New Resource →
Application → your repo → build pack **Dockerfile** → port `3000` → set `MONGODB_URI` to
your Atlas string, `MONGODB_DB=sevaboard`, `BOARD_PASSWORD` (optional) → attach domain.

**Fully self-contained** — app + MongoDB in one stack, no Atlas needed: New Resource →
Docker Compose → your repo (uses the included `docker-compose.yml`, which runs `mongo:7`
with a persistent volume) → set `BOARD_PASSWORD` (optional) → attach domain to the `app`
service.

---

## Environment variables

| Variable         | Required | Notes                                                                 |
|------------------|----------|-----------------------------------------------------------------------|
| `MONGODB_URI`    | yes      | Railway Mongo reference variable, Atlas string, or `mongodb://mongo:27017` with the bundled compose. |
| `MONGODB_DB`     | no       | Defaults to `sevaboard`.                                              |
| `BOARD_PASSWORD` | no       | If set, the app shows a passcode screen and every API call requires it. Leave empty only if the app sits behind Coolify/Cloudflare Access. |
| `MS_TENANT_ID`   | no*      | Azure AD tenant ID. Enables sending email via Microsoft 365 / Outlook. |
| `MS_CLIENT_ID`   | no*      | Azure AD app (client) ID. |
| `MS_CLIENT_SECRET` | no*    | Azure AD app client secret. |
| `MS_SENDER_EMAIL`  | no*    | The mailbox the app sends as, e.g. `mukunda@hkmvizag.org`. Must be a real licensed mailbox in your tenant. |
| `RESEND_API_KEY` | no       | Fallback provider, only used if the Microsoft vars above aren't set. |
| `EMAIL_FROM`     | no       | Sender shown on Resend emails only. Ignored when Microsoft Graph is configured (Graph always sends as `MS_SENDER_EMAIL`). |

\* Not individually required, but all four Microsoft vars must be set together to enable Graph sending.

Copy `.env.example` to `.env` for local runs.

---

## Access & security

- Member phone numbers live on this board, so don't leave it fully open on a public URL.
  Either set `BOARD_PASSWORD`, or put it behind Coolify's built-in auth / Cloudflare Access.
- The passcode is a single shared team code (not per-user accounts). When you want real
  logins with a `seva_admin` role and per-seva permissions, that's the next iteration.

---

## Local development

```bash
cp .env.example .env      # fill in MONGODB_URI
npm install
npm run dev               # http://localhost:3000
```

---

## Backup & data

- Use the in-app **Backup** menu to export/import the whole board as JSON at any time.
- In Mongo, everything is one document: db `sevaboard`, collection `board`, `_id: "main"`.

---

## Task tracking

Every task keeps a full activity trail from creation to completion — status changes,
assignment/unassignment, priority and due-date edits, seva changes, and email sends —
each with a timestamp and who did it. It's visible under **Activity & tracking** inside
the task modal, newest first. Nothing here is editable; it's an audit log, not a field.

## Email notifications (Microsoft 365)

Add an email address to a devotee under **Manage → Team**. When they're assigned to a
task (on creation or by adding them later), the app automatically emails them — with the
seva, due date, priority, and notes — sent through **`mukunda@hkmvizag.org`** via
Microsoft Graph (that mailbox's existing Microsoft 365/Outlook licence is exactly what's
needed here — no new mailbox required). You can also resend manually from the
**Email seva assignment** button inside any task. Every send is logged in that task's
activity trail.

**One-time Azure AD setup** (do this once in the Microsoft 365 admin center's Azure
Portal — since `mukunda@hkmvizag.org` is on your Business/Enterprise tenant, this is a
standard app-registration flow; do it as, or with, whoever holds Global Admin):

1. Go to **Azure Portal → Microsoft Entra ID → App registrations → New registration**.
   Name it e.g. "Seva Board", leave redirect URI blank, register.
2. Copy the **Application (client) ID** and **Directory (tenant) ID** from the app's
   Overview page → these become `MS_CLIENT_ID` and `MS_TENANT_ID`.
3. **Certificates & secrets → New client secret** → copy the secret's *value*
   immediately (it's hidden after you leave the page) → this becomes `MS_CLIENT_SECRET`.
4. **API permissions → Add a permission → Microsoft Graph → Application permissions**
   → search `Mail.Send` → add it.
5. Still on API permissions, click **Grant admin consent for [your org]** (needs a
   Global Admin or Exchange Admin). Without this step, sends will fail with a
   permissions error.
6. Set `MS_SENDER_EMAIL=mukunda@hkmvizag.org`. It's already a real, licensed mailbox
   in your tenant, so no further mailbox setup is needed — the app sends *as* it.

**Recommended: restrict the app to only this one mailbox.** Step 5's `Mail.Send`
permission is otherwise tenant-wide — technically the app could send as *any* mailbox in
your org, not just this one. Since `mukunda@hkmvizag.org` is a personal account rather
than a shared/service mailbox, it's worth locking that down. In
[Exchange Online PowerShell](https://learn.microsoft.com/en-us/powershell/exchange/connect-to-exchange-online-powershell)
(connect as a Global/Exchange Admin):

```powershell
New-ApplicationAccessPolicy -AppId <MS_CLIENT_ID> `
  -PolicyScopeGroupId mukunda@hkmvizag.org -AccessRight RestrictAccess `
  -Description "Seva Board — restrict to Mukunda's mailbox only"

# Verify it worked:
Test-ApplicationAccessPolicy -AppId <MS_CLIENT_ID> -Identity mukunda@hkmvizag.org
```

This makes the app registration only able to send as `mukunda@hkmvizag.org`, and Graph
will reject any attempt to send as another mailbox.

Set all four vars (`MS_TENANT_ID`, `MS_CLIENT_ID`, `MS_CLIENT_SECRET`, `MS_SENDER_EMAIL`)
in Coolify's environment settings and redeploy. No code changes needed.

If the Microsoft vars aren't set, the app falls back to Resend (if `RESEND_API_KEY` is
set), and if neither is configured the email buttons show a clear "not configured"
message instead of failing silently.

## Notes


- WhatsApp notify opens `wa.me` with a pre-filled message; the sender still taps send.
  Email notify sends automatically through Microsoft 365 (or Resend as fallback), no extra tap needed on assignment.
- Recurring tasks spawn their next occurrence automatically when marked Completed.
- To trigger automated WhatsApp reminders (via Flaxxa) on recurring/overdue tasks,
  add a small cron route that reads the board and calls the Flaxxa template API — happy to
  add that when you need it.
