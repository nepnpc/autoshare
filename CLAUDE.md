# AutoShare — Meroshare IPO Auto-Apply Platform

## Project Overview

Free community web app for Nepal stock investors. Users connect GitHub, enter Meroshare credentials once, bot auto-applies for every IPO daily. Code fully private (compiled binary in Docker). Zero server cost.

## Core Architecture

```
User Browser → Next.js (Cloudflare Pages)
                    ↓ HTTPS
              FastAPI (Oracle ARM)
                    ↓ GitHub API
              User's Private GitHub Repo
                    ↓ GitHub Actions (cron daily)
              Docker Image (compiled bot binary)
                    ↓ Playwright
              meroshare.com.np
```

## How It Works

1. User visits AutoShare site
2. Clicks "Connect with GitHub" → GitHub OAuth (like Login with Google)
3. User creates GitHub account if needed (one-time, can use Gmail)
4. Authorizes AutoShare app on GitHub
5. Enters Meroshare credentials on AutoShare site
6. AutoShare backend silently:
   - Creates private repo in user's GitHub account
   - Stores credentials as GitHub Secrets (encrypted by GitHub)
   - Pushes workflow YAML to repo
   - Enables Actions scheduler
7. Done. Bot runs daily. User never touches GitHub again.

## Security Model

- Meroshare credentials stored ONLY in user's GitHub Secrets (not in AutoShare DB)
- GitHub encrypts secrets with Libsodium — even GitHub can't read them
- AutoShare DB stores: user_id, github_username, repo_name, status ONLY
- Bot code compiled to binary via PyInstaller — not readable even if Docker image pulled
- HTTPS everywhere (Cloudflare handles certs)
- Users can revoke access by deleting their GitHub repo or revoking OAuth app

## Tech Stack

| Layer | Tech | Why | Cost |
|---|---|---|---|
| Frontend | Next.js 14 (App Router) | Fast, SSR, good DX | Free (Cloudflare Pages) |
| Styling | Tailwind CSS + shadcn/ui | Beautiful, lightweight | Free |
| Backend API | FastAPI (Python) | Same lang as bot | Free (Oracle ARM) |
| Database | PostgreSQL via Supabase | Managed, free tier | Free (500MB) |
| Auth | GitHub OAuth (GitHub App) | Users need GitHub anyway | Free |
| Bot Runtime | GitHub Actions (user account) | User's free minutes | Free |
| Bot Packaging | PyInstaller → Docker | Hides source code | Free |
| Docker Registry | GitHub Container Registry (ghcr.io) | Private images supported | Free |
| CDN/DDoS | Cloudflare | Global, fast | Free |
| Server | Oracle ARM Free Tier | 4 OCPU + 24GB RAM | Free forever |

**Total monthly cost: $0**

## Oracle ARM Server Setup

```
Oracle ARM Free Tier Specs:
- 4 OCPU (ARM Cortex-A72)
- 24GB RAM
- 200GB block storage
- Unlimited bandwidth (within Oracle)

Runs:
- FastAPI app (uvicorn, ~50MB RAM)
- PostgreSQL (local fallback, ~200MB RAM)
- Redis (job queue, ~50MB RAM)
- Nginx (reverse proxy)
```

## GitHub App Permissions Required

```
Repository permissions:
  - Contents: Read & Write (create/push files)
  - Secrets: Read & Write (store Meroshare credentials)
  - Actions: Read & Write (enable/trigger workflows)
  - Metadata: Read (required)

Account permissions:
  - None needed
```

## Database Schema

```sql
-- users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    github_user_id BIGINT UNIQUE NOT NULL,
    github_username TEXT NOT NULL,
    github_repo_name TEXT,
    github_installation_id BIGINT,
    meroshare_dp TEXT,        -- DMAT broker code (not sensitive)
    status TEXT DEFAULT 'active',  -- active | paused | error
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_run_at TIMESTAMPTZ,
    last_run_status TEXT
);

-- ipo_runs table (audit log)
CREATE TABLE ipo_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    ipo_name TEXT,
    run_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT,  -- applied | already_applied | error | skipped
    error_message TEXT
);
```

## Bot Docker Image (bot/)

```
bot/
├── Dockerfile
├── build.sh          # PyInstaller compile script
├── requirements.txt
└── (source files from meroshare-ipo-bot — DO NOT commit here)
```

### Build Pipeline

```dockerfile
# Dockerfile
FROM python:3.11-slim AS builder

RUN pip install pyinstaller playwright
COPY requirements.txt .
RUN pip install -r requirements.txt
RUN playwright install chromium --with-deps

# Copy compiled binary (NOT source)
COPY dist/ipo_bot /app/ipo_bot

FROM python:3.11-slim
RUN playwright install-deps chromium
COPY --from=builder /app/ipo_bot /app/ipo_bot

ENV MEROSHARE_USER=""
ENV MEROSHARE_PASS=""
ENV MEROSHARE_DP=""

ENTRYPOINT ["/app/ipo_bot"]
```

### GitHub Actions Workflow (injected into user repo)

```yaml
name: AutoShare IPO Bot
on:
  schedule:
    - cron: '30 0 * * *'  # 6:15 AM Nepal time (UTC+5:45)
  workflow_dispatch:       # Allow manual trigger

jobs:
  apply-ipo:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - name: Apply for IPOs
        run: |
          docker run --rm \
            -e MEROSHARE_USER="${{ secrets.MEROSHARE_USER }}" \
            -e MEROSHARE_PASS="${{ secrets.MEROSHARE_PASS }}" \
            -e MEROSHARE_DP="${{ secrets.MEROSHARE_DP }}" \
            -e WEBHOOK_URL="${{ secrets.AUTOSHARE_WEBHOOK }}" \
            ghcr.io/OWNER/autoshare-bot:latest

      - name: Report status
        if: always()
        run: echo "Run complete with status ${{ job.status }}"
```

## Backend API (backend/)

```
backend/
├── main.py
├── routers/
│   ├── auth.py       # GitHub OAuth flow
│   ├── users.py      # User management
│   ├── setup.py      # Repo + secrets setup
│   └── status.py     # Bot run status
├── services/
│   ├── github.py     # GitHub API client
│   └── crypto.py     # Webhook secret generation
├── models.py
├── database.py
└── requirements.txt
```

### Key API Endpoints

```
POST /auth/github/callback    # GitHub OAuth callback → create user, setup repo
GET  /auth/me                 # Current user info
POST /setup/credentials       # Store Meroshare credentials as GitHub Secrets
GET  /status                  # Bot run history
POST /bot/trigger             # Manual trigger (calls workflow_dispatch)
DELETE /account               # Delete repo + revoke, remove user
```

### GitHub OAuth Flow

```python
# 1. Frontend redirects to:
https://github.com/login/oauth/authorize
  ?client_id=GITHUB_APP_CLIENT_ID
  &redirect_uri=https://autoshare.app/auth/callback
  &scope=repo,workflow
  &state=CSRF_TOKEN

# 2. GitHub redirects back to:
https://autoshare.app/auth/callback?code=CODE&state=STATE

# 3. Backend exchanges code for token:
POST https://github.com/login/oauth/access_token
  {client_id, client_secret, code}
  → {access_token, scope, token_type}

# 4. Backend uses token to:
#    - Get user info (GET /user)
#    - Create repo (POST /user/repos)
#    - Set secrets (PUT /repos/{owner}/{repo}/actions/secrets/{name})
#    - Push workflow file (PUT /repos/{owner}/{repo}/contents/.github/workflows/bot.yml)
```

## Frontend (frontend/)

```
frontend/
├── app/
│   ├── page.tsx          # Landing page
│   ├── setup/
│   │   └── page.tsx      # Onboarding (credentials entry)
│   ├── dashboard/
│   │   └── page.tsx      # Status + history
│   └── auth/
│       └── callback/
│           └── page.tsx  # GitHub OAuth callback handler
├── components/
│   ├── HeroSection.tsx
│   ├── HowItWorks.tsx
│   ├── CredentialsForm.tsx
│   └── StatusCard.tsx
└── lib/
    └── api.ts            # Backend API client
```

### User Journey (5 screens)

```
1. Landing     → "Apply for every IPO automatically. Free forever."
                  [Connect with GitHub]

2. GitHub Auth → GitHub OAuth page (user sees GitHub, clicks Authorize)

3. Credentials → "Enter your Meroshare details"
                  - Username (DMAT number)
                  - Password
                  - DP (broker selection dropdown)
                  [Save & Activate Bot]

4. Success     → "You're all set! Bot runs daily at 6:15 AM"
                  [View Dashboard]

5. Dashboard   → IPO history, last run status, manual trigger button
```

## Build Order

### Phase 1: Bot Docker Image (Week 1)
- [ ] Copy meroshare-ipo-bot code to bot/ (DO NOT commit — .gitignore)
- [ ] Add env var support (read credentials from ENV, not config files)
- [ ] Add webhook callback (POST run result to AutoShare backend)
- [ ] Compile with PyInstaller: `pyinstaller --onefile main.py`
- [ ] Build Docker image, test locally
- [ ] Push to ghcr.io as private image
- [ ] Test: `docker run -e MEROSHARE_USER=x -e MEROSHARE_PASS=y image`

### Phase 2: Backend API (Week 2)
- [ ] Setup Oracle ARM VM (Ubuntu 22.04)
- [ ] Install: Python 3.11, PostgreSQL, Redis, Nginx
- [ ] Create Supabase project (free tier)
- [ ] Register GitHub OAuth App (Settings → Developer settings)
- [ ] Build FastAPI app with auth + setup + status endpoints
- [ ] Deploy to Oracle ARM with systemd service
- [ ] Setup Nginx reverse proxy + Cloudflare

### Phase 3: Frontend (Week 3)
- [ ] Create Next.js app
- [ ] Build 5 screens (landing, setup, dashboard, etc.)
- [ ] Connect to backend API
- [ ] Deploy to Cloudflare Pages (free)
- [ ] Custom domain setup

### Phase 4: Testing & Launch (Week 4)
- [ ] End-to-end test with real Meroshare account
- [ ] Test with 5 beta users
- [ ] Monitor GitHub Actions runs
- [ ] Launch announcement (Facebook groups, Reddit Nepal, Twitter)

## Viral Growth Strategy

Target communities:
- Facebook: Nepal Stock Market groups (100k+ members)
- Reddit: r/Nepal, r/NepalStock
- Discord: Nepal stock servers

Key message:
> "Never miss an IPO again. Free, automatic, secure — your password stays in your GitHub, not ours."

## Scaling Plan

| Users | Infrastructure |
|---|---|
| 0–1,000 | Single Oracle ARM (current) |
| 1,000–10,000 | Second Oracle account (second ARM instance) |
| 10,000–100,000 | Third/fourth Oracle accounts OR minimal VPS ($5/mo) |
| 100,000+ | Evaluate paid infra |

Scale is manageable: bots run once/day, 3 min each, 7-day IPO window. Even 100k users = only ~50k active bot runs per IPO cycle spread over days.

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://...
GITHUB_APP_CLIENT_ID=...
GITHUB_APP_CLIENT_SECRET=...
GITHUB_APP_WEBHOOK_SECRET=...
DOCKER_IMAGE=ghcr.io/OWNER/autoshare-bot:latest
WEBHOOK_SECRET_SALT=...
FRONTEND_URL=https://autoshare.app
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=https://api.autoshare.app
NEXT_PUBLIC_GITHUB_CLIENT_ID=...
```

## Key Design Decisions

1. **No credential storage on our servers** — GitHub Secrets only. Users trust GitHub already.
2. **Compiled binary** — PyInstaller makes source unreadable without decompiler.
3. **Private Docker image on ghcr.io** — extra layer, image not publicly pullable.
4. **Webhook callback** — bot POSTs run result to backend so dashboard shows live status.
5. **workflow_dispatch** — manual trigger from dashboard without needing GitHub access.
6. **GitHub App vs OAuth App** — GitHub App preferred (better permissions UX, installation model).

## Repository Structure

```
AutoShare/
├── CLAUDE.md           ← this file
├── backend/            ← FastAPI app
├── frontend/           ← Next.js app
├── bot/                ← Docker image (source NOT committed)
│   ├── Dockerfile
│   ├── build.sh
│   └── requirements.txt
└── docs/
    ├── architecture.md
    └── deployment.md
```

## Notes

- Source project: C:\Users\User\Desktop\meroshare-ipo-bot (DO NOT TOUCH)
- Bot source gets compiled → binary → Docker. Source never in AutoShare repo.
- Oracle ARM free tier is permanent (not time-limited like AWS free tier)
- Cloudflare Pages has unlimited requests on free tier
- Supabase free tier: 500MB DB, 50k rows, 2GB bandwidth/month
