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

The same Dockerfile works unchanged on Coolify. Two options, both on port **8080**:

**App container + MongoDB Atlas** — Coolify only runs the app: New Resource →
Application → your repo → build pack **Dockerfile** → port `8080` → set `MONGODB_URI` to
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
| `APP_BASE_URL`   | no**     | Public URL of the deployed app, e.g. `https://seva-board.up.railway.app`. Needed for the Outlook "Connect" sign-in flow's redirect URI. |
| `MS_TENANT_ID`   | no*      | Azure AD tenant ID. Shared by both Microsoft email options below. |
| `MS_CLIENT_ID`   | no*      | Azure AD app (client) ID. Shared by both Microsoft email options below. |
| `MS_CLIENT_SECRET` | no*    | Azure AD app client secret. Shared by both Microsoft email options below. |
| `MS_SENDER_EMAIL`  | no     | Only used by the app-only fallback (no sign-in). Ignored if an account is connected via "Connect Outlook". |
| `RESEND_API_KEY` | no       | Last-resort fallback, only used if neither Microsoft option is set up. |
| `EMAIL_FROM`     | no       | Sender shown on Resend emails only. |

\* Required together to enable *either* Microsoft email option.
\*\* Required only for the "Connect Outlook" sign-in flow.

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

## Email notifications (Microsoft 365 / Outlook)

Add an email address to a devotee under **Manage → Team**. When they're assigned to a
task (on creation or by adding them later), the app automatically emails them — with the
seva, due date, priority, and notes. Every send is logged in that task's activity trail,
and you can resend manually any time from the **Email seva assignment** button inside a
task.

There are two ways to wire up the actual sending, both using the same Azure AD app
registration. **Use option 1** unless you specifically want a fixed, no-login sender.

### Option 1 — Connect Outlook (recommended, sign-in based)

You (or anyone using this board) click **Manage → Email account → Connect Outlook**,
sign into Microsoft normally, and approve the app sending mail as you. No admin consent
step is required if your tenant allows individual users to consent to this scope — if
it doesn't, a Global Admin approves it once for the app, same as option 2 below.
This is the better fit for a personal tool: it's you signing in as yourself, not a
shared service identity, and it's what makes the tool usable by someone else too — they
connect their own Outlook account the same way.

**One-time Azure AD setup:**

1. **Azure Portal → Microsoft Entra ID → App registrations → New registration.**
   Name it "Seva Board", leave redirect URI blank for now, register.
2. Copy the **Application (client) ID** and **Directory (tenant) ID** → `MS_CLIENT_ID`
   and `MS_TENANT_ID`.
3. **Certificates & secrets → New client secret** → copy the *value* immediately →
   `MS_CLIENT_SECRET`.
4. **Authentication → Add a platform → Web.** Redirect URI:
   `{APP_BASE_URL}/api/auth/microsoft/callback` — e.g.
   `https://seva-board.up.railway.app/api/auth/microsoft/callback`. This must match
   `APP_BASE_URL` exactly (protocol + host, no trailing slash).
5. **API permissions → Add a permission → Microsoft Graph → Delegated permissions** →
   add `Mail.Send`, `offline_access`, and `User.Read` (the last is usually already
   there by default).
6. If your tenant requires admin consent for delegated permissions too, click
   **Grant admin consent for [your org]** here as well.
7. Set `MS_TENANT_ID`, `MS_CLIENT_ID`, `MS_CLIENT_SECRET`, and `APP_BASE_URL` in
   Railway, redeploy, then click **Connect Outlook** inside the app.

The connected account (email, display name, and refresh token) is stored in MongoDB —
tokens are refreshed automatically and never shown in the UI. **Manage → Email account**
shows who's connected and has a **Disconnect** button.

### Option 2 — App-only, fixed sender (advanced, no sign-in)

Sends as one fixed mailbox with no login step, but needs a Global Admin to grant
tenant-wide consent up front, and technically that consent lets the app send as *any*
mailbox in your tenant unless you restrict it (see below). Better suited to a shared
service mailbox than a personal inbox.

Same app registration as above, plus:

1. **API permissions → Add a permission → Microsoft Graph → Application permissions**
   → add `Mail.Send`.
2. **Grant admin consent for [your org]** (needs Global Admin or Exchange Admin).
3. Set `MS_SENDER_EMAIL` to the mailbox to send as, e.g. `mukunda@hkmvizag.org` — must
   be a real, licensed mailbox in your tenant.

**Recommended: restrict the app to only that one mailbox** (since `Mail.Send`
application permission is otherwise tenant-wide). In
[Exchange Online PowerShell](https://learn.microsoft.com/en-us/powershell/exchange/connect-to-exchange-online-powershell)
(as a Global/Exchange Admin):

```powershell
New-ApplicationAccessPolicy -AppId <MS_CLIENT_ID> `
  -PolicyScopeGroupId mukunda@hkmvizag.org -AccessRight RestrictAccess `
  -Description "Seva Board — restrict to this mailbox only"

Test-ApplicationAccessPolicy -AppId <MS_CLIENT_ID> -Identity mukunda@hkmvizag.org
```

### Provider order

If an Outlook account is connected via option 1, it's always used first. Otherwise, if
`MS_SENDER_EMAIL` (option 2) is set, that's used. Otherwise, if `RESEND_API_KEY` is set,
that's the fallback. If none of these are configured, the email buttons show a clear
"not configured" message instead of failing silently.

## Notes

- WhatsApp notify opens `wa.me` with a pre-filled message; the sender still taps send.
  Email notify sends automatically, no extra tap needed on assignment.
- Recurring tasks spawn their next occurrence automatically when marked Completed.
- To trigger automated WhatsApp reminders (via Flaxxa) on recurring/overdue tasks,
  add a small cron route that reads the board and calls the Flaxxa template API — happy to
  add that when you need it.
