# AutoShare — Never Miss a Nepal IPO Again

**Free, automatic IPO application for Nepal stock investors.**

AutoShare applies for every open IPO on Meroshare — daily, automatically, while you sleep. No manual login. No missed deadlines. Free forever.

🌐 **[www.subarnakatwal.com.np](https://www.subarnakatwal.com.np)**

---

## How It Works

```
You visit AutoShare → Connect GitHub → Enter Meroshare credentials → Done.
Bot applies for every IPO at 6:15 AM Nepal time, every single day.
```

That's it. You never touch GitHub or Meroshare manually again.

---

## Step-by-Step Setup (5 minutes)

### Step 1 — Visit AutoShare
Go to **[www.subarnakatwal.com.np](https://www.subarnakatwal.com.np)**

### Step 2 — Connect with GitHub
Click **"Connect with GitHub"**. If you don't have a GitHub account, [create one free](https://github.com/signup) (you can use your Gmail).

> GitHub is where your credentials will be stored — securely encrypted. AutoShare never sees your password.

### Step 3 — Authorize AutoShare
GitHub will ask permission for AutoShare to create a private repository in your account. Click **Authorize**.

### Step 4 — Enter Meroshare Details
Enter your:
- **Username** — your DMAT/CRN number
- **Password** — your Meroshare login password
- **DP** — select your broker from the dropdown

Click **Save & Activate Bot**.

### Step 5 — You're Done
AutoShare will:
- Create a **private repo** in your GitHub account
- Store your credentials as **encrypted GitHub Secrets**
- Set up a **daily bot** that runs at 6:15 AM Nepal time

Check your **Dashboard** anytime to see which IPOs were applied for and when.

---

## Your Password is Safe — Here's Exactly Why

This is the most important part. Read it once.

### Where your password goes

```
Your password → GitHub Secrets (encrypted) → NEVER stored on AutoShare servers
```

AutoShare **never stores your Meroshare password**. When you enter your credentials, they are sent directly to GitHub and stored as [GitHub Actions Secrets](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions) — encrypted using [Libsodium](https://libsodium.gitbook.io/doc/) with a key that only GitHub holds.

**Not even GitHub can read your secrets** — they are encrypted at rest and only decrypted inside the isolated runner environment when your bot runs.

### What AutoShare stores

| Data | Stored on AutoShare? |
|------|----------------------|
| Meroshare username | No |
| Meroshare password | **Never** |
| GitHub username | Yes (public info) |
| Which repo the bot is in | Yes |
| IPO run history | Yes (pass/fail, no credentials) |

AutoShare's database contains **zero sensitive credentials**.

### The bot code is compiled

The bot that applies for IPOs is compiled into a binary using [PyInstaller](https://pyinstaller.org/). Even if someone pulled the Docker image, they cannot read the source code. The binary runs inside your private GitHub Actions environment.

### You can revoke access anytime

- **Delete the repo** in your GitHub account → bot stops permanently
- **Revoke OAuth app** → Settings → Applications → Authorized OAuth Apps → Revoke AutoShare
- **Delete account** from AutoShare dashboard → removes your data from our DB

---

## Frequently Asked Questions

**Q: Do I need to know anything about GitHub or coding?**
No. AutoShare handles everything. GitHub is just used as secure storage — you never need to touch it.

**Q: Is this free?**
Yes. Free forever. No credit card. No hidden fees.

**Q: What if I change my Meroshare password?**
Go to the AutoShare dashboard → Update Credentials → enter new password. Bot updates automatically.

**Q: What IPOs does it apply for?**
All open IPOs available on your Meroshare account on the day the bot runs.

**Q: What if the bot fails?**
The dashboard shows the error. You can trigger a manual run from the dashboard. Common errors (wrong password, IPO already closed) are shown clearly.

**Q: Can AutoShare steal my shares or money?**
No. The bot can only **apply** for IPOs. It cannot sell shares, transfer money, or access your DEMAT account beyond IPO application.

**Q: How do I know the bot ran?**
Check the **Dashboard** — every run is logged with timestamp, IPO name, and status (applied / already applied / error / skipped).

---

## Security Summary

| Feature | Implementation |
|---------|---------------|
| Credential storage | GitHub Secrets (Libsodium encryption) |
| Transport security | HTTPS everywhere (Cloudflare SSL) |
| Bot code protection | PyInstaller binary (not readable) |
| Docker image | Private (ghcr.io, not publicly pullable) |
| AutoShare DB | Stores zero credentials |
| Revocation | Delete repo or revoke OAuth — instant |

---

## Built for Nepal Investors

AutoShare was built by a Nepal stock investor, for Nepal stock investors. The goal: make IPO application as effortless as possible so no one misses an opportunity due to a forgotten deadline.

**Share with your friends:**
> "Never miss an IPO again. Free, automatic, secure — your password stays in your GitHub, not ours."

---

*Questions or issues? Open a GitHub issue or contact via the dashboard.*
