# Email Setup with Resend — SRC e-solutions

Status (2026-10-26): **code is ready; waiting for the domain `srcesolutions.store` to be bought and verified.**
Until the keys below are added, the site works normally and simply sends no email.

---

## 1. What emails the site sends

Every time a student submits a project request, two emails go out:

| # | To | Subject | Contents |
|---|----|---------|----------|
| 1 | **Owner** (`OWNER_EMAIL`) | `New request SRC-XXXX: <title>` | Ref code, student name + college, phone / WhatsApp, email, category, title, deadline, budget, full description, and an **Open dashboard** button linking to `/x9`. |
| 2 | **Student** (the email they typed) | `We got your project request (SRC-XXXX)` | "Request received ✅", their reference code in big letters, a **Track my project** button (`/status/SRC-XXXX`), and a note that replies are not read. |

What the student email deliberately does **not** contain:
- the owner's phone number, WhatsApp or personal email — students must not be able to reach him directly;
- any reply address — it is sent from `noreply@srcesolutions.store`.

---

## 2. How it works in the code

| File | Role |
|------|------|
| `src/lib/email.ts` | `sendEmail()` calls Resend's HTTP API (`POST https://api.resend.com/emails`) with plain `fetch` — no extra npm package. Also holds the two templates (`newRequestAlert`, `requestConfirmation`) and `esc()`, which HTML-escapes everything a student typed. |
| `src/app/actions.ts` | After a request is saved, schedules both emails with Next.js `after()` so they are sent **after** the response — the student never waits for email. |

Safety built in:
- **No keys → no sending.** If `RESEND_API_KEY` or `EMAIL_FROM` is missing, `sendEmail()` returns silently.
- **Email failure never breaks a submission.** Errors are logged as `[email] …` in the server log; the request is still saved.
- **HTML injection is blocked.** Student text is escaped, so nobody can plant fake links or buttons in the owner's inbox (security audit item M1 — fixed).
- The old Gmail system (`nodemailer` + `EMAIL_USER` / `EMAIL_APP_PASSWORD`) was **removed**, which also removed a vulnerable dependency (audit item H7).

---

## 3. Cost and limits (Resend free plan)

| Item | Free plan |
|------|-----------|
| Emails per month | 3,000 |
| Emails per day | 100 |
| Domains | 1 |
| Price | ₹0 |

Each request sends **2 emails**, so the free plan handles about **50 requests per day** / **1,500 per month**.
If he ever needs more, Resend's paid plan (about $20/month) removes the daily cap. Check current pricing on resend.com before upgrading.

The only real cost is the **domain** (`.store` domains are usually cheap for the first year; check the renewal price before buying).

---

## 4. Step-by-step setup

### Step 1 — Buy the domain
1. Buy `srcesolutions.store` from any registrar (Hostinger, GoDaddy, Namecheap, Cloudflare, etc.).
2. Note **where its DNS is managed**: usually the registrar's dashboard ("DNS", "DNS Zone" or "Manage DNS").
   - If the site will be hosted on **Vercel** and you point the domain's nameservers to Vercel, the DNS is then managed **in Vercel**, and the records in Step 4 go there instead.

### Step 2 — Create a Resend account
1. Sign up at **https://resend.com**. Use an email the business owner controls, so the account isn't tied to a freelancer.
2. Enable **two-factor authentication** in account settings.

### Step 3 — Add the domain in Resend
1. Open **Domains → Add Domain**.
2. Enter: `srcesolutions.store`
3. Region: pick **Tokyo (ap-northeast-1)**, the closest to India.
4. Resend now shows a list of DNS records. Keep this page open.

### Step 4 — Add the DNS records
Copy each record **exactly** from the Resend page into your DNS settings. They usually look like this; always use the values Resend shows, not these examples:

| Type | Name / Host | Value (example) | Purpose |
|------|-------------|-----------------|---------|
| TXT | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3DQEB…` (long key) | **DKIM**: proves emails really come from your domain |
| MX | `send` | `feedback-smtp.ap-northeast-1.amazonses.com` (priority 10) | Handles bounces |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | **SPF**: allows Resend to send for your domain |
| TXT | `_dmarc` | `v=DMARC1; p=none;` | **DMARC**: recommended; improves inbox placement. Add it yourself if Resend doesn't list it. |

Tips:
- Many registrars add the domain automatically, so for Name enter only `resend._domainkey`, **not** `resend._domainkey.srcesolutions.store`.
- Leave TTL at the default (or 3600).
- Don't delete any existing records you didn't create.

### Step 5 — Verify
1. Back in Resend, click **Verify DNS Records**.
2. It usually verifies within minutes, but DNS can take **up to 24–48 hours**.
3. Wait until the domain shows **Verified** (green).

### Step 6 — Create the API key
1. Open **API Keys → Create API Key**.
2. Name: `srcesolutions-website`
3. Permission: **Sending access** (not Full access).
4. Domain: restrict to `srcesolutions.store`.
5. Copy the key (`re_…`). **It's shown only once.** Never paste it into chat, WhatsApp or git.

### Step 7 — Add the environment variables
In `.env.local` (local development):

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM="SRC e-solutions <noreply@srcesolutions.store>"
OWNER_EMAIL=owner-personal-email@gmail.com
NEXT_PUBLIC_APP_URL=https://srcesolutions.store
```

| Variable | Meaning |
|----------|---------|
| `RESEND_API_KEY` | The key from Step 6 |
| `EMAIL_FROM` | Sender name + address. Must be on the verified domain. `noreply@` doesn't need a real inbox. |
| `OWNER_EMAIL` | Where new-request alerts go (the owner's own inbox). Students never see it. |
| `NEXT_PUBLIC_APP_URL` | Used for the "Open dashboard" and "Track my project" links in emails |

Also **delete these old lines** from `.env.local`; they're no longer used:
```env
EMAIL_USER=...
EMAIL_APP_PASSWORD=...
```
If that Gmail App Password was created only for this site, revoke it in the Google account (Security → App passwords).

### Step 8 — Add the same variables to hosting
On Vercel: **Project → Settings → Environment Variables**. Add all four for **Production** (and Preview if used), then **redeploy** so they take effect.

### Step 9 — Test
1. Restart the dev server (`npm run dev`) so it reads the new `.env.local`.
2. Submit a test request on `/submit` using **your own email** as the student.
3. Within a few seconds you should get:
   - the **confirmation** at the student address;
   - the **new request alert** at `OWNER_EMAIL`.
4. Check that the "Track my project" link opens the right status page.
5. Check the spam folder the first time. If it landed there, mark it **Not spam**.
6. Delete the test request from the admin dashboard afterwards.

---

## 5. Troubleshooting

Look at the terminal running the server (or Vercel → Logs) for lines starting with `[email]`.

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| No emails at all, no `[email]` log | `RESEND_API_KEY` or `EMAIL_FROM` not set / server not restarted | Check `.env.local`, restart the dev server, or redeploy on Vercel |
| `[email] Resend rejected the email: 403` … "domain is not verified" | DNS not verified yet | Wait, recheck the records, click Verify again |
| `403` … "You can only send testing emails to your own email" | Sending from `onboarding@resend.dev` or an unverified domain | Use `EMAIL_FROM` on the verified domain |
| `401` | Wrong or revoked API key | Create a new key, update the env var |
| `422` | Badly formatted `EMAIL_FROM` | Use exactly `SRC e-solutions <noreply@srcesolutions.store>` |
| `429` | Rate or daily limit reached (100/day on free) | Wait until tomorrow, or upgrade the plan |
| Owner gets nothing, student does | `OWNER_EMAIL` missing or misspelled | Fix the variable |
| Emails go to spam | New domain, no DMARC | Add the `_dmarc` record; mark as Not spam a few times; reputation improves with use |
| `[email] could not reach Resend` | Server has no internet (e.g. Wi-Fi dropped) | Retry when online; the request itself is still saved |

---

## 6. Security checklist

- [ ] API key has **Sending access only**, restricted to `srcesolutions.store`
- [ ] Key lives only in `.env.local` (gitignored) and Vercel env vars, never in code, chat or screenshots
- [ ] Resend account has 2FA and belongs to the business owner
- [ ] Old Gmail App Password revoked
- [ ] Student emails contain **no** owner phone, WhatsApp or personal email
- [ ] If the key ever leaks: Resend → API Keys → **Revoke**, create a new one, update env vars, redeploy

---

## 7. Possible next steps (not built yet)

| Feature | What it does | Effort |
|---------|--------------|--------|
| **Status emails** | When the owner marks a request **Accepted** → "You're in, we'll contact you soon"; **Rejected** → polite "not this time" with a link to spin a new idea. Hook into `updateStatus` in `src/app/x9/actions.ts`. | ~1 hour |
| Delivery log | Show in the admin page whether each email was sent | ~1–2 hours |
| Store order emails | Order confirmation for the student and an alert for the owner, once Phase 2 saved orders exist | Part of Phase 2 |

All of these run on the same Resend setup at no extra cost, as long as total volume stays within the free limits.
