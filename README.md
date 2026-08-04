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
   - `BOARD_PASSWORD` (optional — see **Logging in** below)
   - The email variables (see **Email notifications** below)
5. **Settings → Networking → Generate Domain** for a free `*.up.railway.app` URL, or attach
   your own domain (e.g. `seva.hkmvizag.org`) with a CNAME.
6. Deploy. Railway injects `PORT` automatically at runtime — the standalone Next server
   already reads `process.env.PORT`, so no changes are needed. Railway's healthcheck hits
   `/api/health` (see `railway.toml`), which stays open regardless of login state.
7. **Log in immediately after the first deploy** and create your account — see
   **Logging in** below. Until someone does this, the first visitor to the URL can claim
   the first account, so don't leave this step for later.

## Alternative: self-host on Coolify

The same Dockerfile works unchanged on Coolify. Two options, both on port **8080**:

**App container + MongoDB Atlas** — Coolify only runs the app: New Resource →
Application → your repo → build pack **Dockerfile** → port `8080` → set `MONGODB_URI` to
your Atlas string, `MONGODB_DB=sevaboard` → attach domain.

**Fully self-contained** — app + MongoDB in one stack, no Atlas needed: New Resource →
Docker Compose → your repo (uses the included `docker-compose.yml`, which runs `mongo:7`
with a persistent volume) → attach domain to the `app` service.

---

## Logging in

There's no shared passcode anymore — everyone gets their own email + password account.

**First visit ever:** since no account exists yet, the app shows "Create the first
account" instead of a sign-in form. If `BOARD_PASSWORD` is set, it also asks for that as
a one-time setup passphrase, so a stranger who finds the URL before you can't grab the
first account. Once you've created it, that screen never appears again — everyone after
you signs in normally, and `BOARD_PASSWORD` no longer does anything at that point.

**Adding people after that:** once logged in, go to **Manage → Logins** to add an email +
password for anyone else who needs access — optionally linking their login to a devotee
so their "I am…" identity is set automatically when they sign in. You can also reset
passwords or remove access there.

Sessions last 30 days (httpOnly cookie) and there's a sign-out button in the header.

---

## Environment variables

| Variable         | Required | Notes                                                                 |
|------------------|----------|-----------------------------------------------------------------------|
| `MONGODB_URI`    | yes      | Railway Mongo reference variable, Atlas string, or `mongodb://mongo:27017` with the bundled compose. |
| `MONGODB_DB`     | no       | Defaults to `sevaboard`.                                              |
| `BOARD_PASSWORD` | no       | Optional one-time setup passphrase required only when creating the very first login account. Does nothing after that. |
| `APP_BASE_URL`   | no*      | Public URL of the deployed app, e.g. `https://seva-board.up.railway.app`. Needed only for the Outlook "Connect" sign-in flow's redirect URI. |
| `GMAIL_USER`     | no**     | A Google Workspace mailbox, e.g. `noreply@harekrishnavizag.org`. Primary email option. |
| `GMAIL_APP_PASSWORD` | no** | App password for that mailbox (see **Email notifications** below). |
| `GMAIL_FROM_NAME` | no      | Display name on outgoing mail. Defaults to "Seva Board". |
| `MS_TENANT_ID`   | no       | Azure AD tenant ID. Shared by both Microsoft email options (used only if Google isn't set up). |
| `MS_CLIENT_ID`   | no       | Azure AD app (client) ID. |
| `MS_CLIENT_SECRET` | no     | Azure AD app client secret. |
| `MS_SENDER_EMAIL`  | no     | Only used by the Microsoft app-only fallback. |
| `RESEND_API_KEY` | no       | Last-resort fallback if none of the above are set up. |
| `EMAIL_FROM`     | no       | Sender shown on Resend emails only. |

\* Required only for the Microsoft "Connect Outlook" sign-in flow.
\*\* Required together to enable Google Workspace sending.

Copy `.env.example` to `.env` for local runs.

---

## Access & security

- Real per-person login now gates the whole app (see **Logging in** above) — no more
  shared passcode. Passwords are hashed (bcrypt) and sessions are httpOnly cookies.
- Anyone with a login can manage sevas, team, festivals, other logins, and the connected
  email account — there's no separate admin role yet. Only add logins for people you trust
  with all of that.

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

## Email notifications

Add an email address to a devotee under **Manage → Team**. When they're assigned to a
task (on creation or by adding them later), the app automatically emails them — with the
seva, due date, priority, and notes. Every send is logged in that task's activity trail,
and you can resend manually any time from the **Email seva assignment** button inside a
task.

### Option 1 — Google Workspace (recommended, fixed shared sender)

The simplest setup: a fixed `noreply@` mailbox that sends every assignment email,
using Gmail's SMTP relay with an app password. No Google Cloud project, no OAuth
consent screen — just a mailbox and a password.

1. In the **Google Workspace Admin console** (admin.google.com), create a new user —
   e.g. `noreply@harekrishnavizag.org`. A real mailbox, not just an alias.
2. Sign into that mailbox once (or have your Workspace admin do it), turn on
   **2-Step Verification** (required for the next step): myaccount.google.com → Security.
3. Go to **myaccount.google.com/apppasswords**, generate an app password for "Mail",
   and copy the 16-character code.
   - If you don't see this option, check **Admin console → Security → Authentication →
     2-step verification** and make sure "Allow users to generate app passwords" is on
     for this account's organizational unit.
4. Set in Railway:
   ```
   GMAIL_USER=noreply@harekrishnavizag.org
   GMAIL_APP_PASSWORD=<the 16-character app password>
   GMAIL_FROM_NAME=Seva Board
   ```
5. Redeploy. No further setup — assignment emails now send automatically from this
   address for everyone using the board.

### Option 2 — Connect Outlook (Microsoft 365, sign-in based)

Only relevant if you're on a Microsoft 365 tenant instead of / alongside Google
Workspace. **Manage → Email account → Connect Outlook** lets a person sign into their
own Microsoft account and approve the app sending mail as them — no admin consent step
needed if the tenant allows self-consent for this scope.

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

### Option 3 — Microsoft app-only, fixed sender (advanced, no sign-in)

Sends as one fixed mailbox with no login step, but needs a Global Admin to grant
tenant-wide consent up front, and technically that consent lets the app send as *any*
mailbox in your tenant unless you restrict it (see below). Better suited to a shared
service mailbox than a personal inbox.

Same app registration as option 2, plus:

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

If `GMAIL_USER`/`GMAIL_APP_PASSWORD` (option 1) are set, Google Workspace is always used
first. Otherwise, an Outlook account connected via option 2 is used. Otherwise, if
`MS_SENDER_EMAIL` (option 3) is set, that's used. Otherwise, if `RESEND_API_KEY` is set,
that's the last-resort fallback. If none of these are configured, the email buttons show
a clear "not configured" message instead of failing silently.

## Notes

- WhatsApp notify opens `wa.me` with a pre-filled message; the sender still taps send.
  Email notify sends automatically, no extra tap needed on assignment.
- Recurring tasks spawn their next occurrence automatically when marked Completed.
- To trigger automated WhatsApp reminders (via Flaxxa) on recurring/overdue tasks,
  add a small cron route that reads the board and calls the Flaxxa template API — happy to
  add that when you need it.
