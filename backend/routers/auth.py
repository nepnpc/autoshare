import hashlib
import hmac
import random
import secrets
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from config import settings
from database import get_db
from models import User
from services import github as gh
from services.crypto import encrypt
from auth_utils import create_token, get_current_user
from main import limiter

router = APIRouter(prefix="/auth", tags=["auth"])

REPO_NAME = "autoshare-ipo-bot"


def _sign_state(token: str) -> str:
    return hmac.new(settings.jwt_secret.encode(), token.encode(), hashlib.sha256).hexdigest()  # type: ignore[attr-defined]


def _make_state() -> str:
    token = secrets.token_urlsafe(16)
    return f"{token}.{_sign_state(token)}"


def _verify_state(state: str) -> bool:
    parts = state.split(".", 1)
    if len(parts) != 2:
        return False
    token, sig = parts
    return hmac.compare_digest(sig, _sign_state(token))


@router.get("/login")
@limiter.limit("20/minute")
async def login(request: Request):
    state = _make_state()
    url = (
        "https://github.com/login/oauth/authorize"
        f"?client_id={settings.github_client_id}"
        f"&redirect_uri={settings.frontend_url}/auth/callback"
        "&scope=repo,workflow"
        f"&state={state}"
    )
    return {"url": url, "state": state}


@router.get("/callback")
@limiter.limit("20/minute")
async def callback(
    request: Request,
    code: str = Query(...),
    state: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    if not _verify_state(state):
        raise HTTPException(status_code=400, detail="Invalid OAuth state")

    try:
        token = await gh.exchange_code(settings.github_client_id, settings.github_client_secret, code)
        user_data = await gh.get_user(token)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"GitHub OAuth failed: {e}")

    github_user_id = user_data["id"]
    github_username = user_data["login"]

    result = await db.execute(select(User).where(User.github_user_id == github_user_id))
    user = result.scalar_one_or_none()

    if user:
        user.github_access_token_enc = encrypt(token)
        user.github_username = github_username
    else:
        user = User(
            github_user_id=github_user_id,
            github_username=github_username,
            github_access_token_enc=encrypt(token),
            github_repo_name=REPO_NAME,
            webhook_token=secrets.token_urlsafe(32),
            status="pending",
        )
        db.add(user)

    await db.commit()
    await db.refresh(user)

    try:
        await gh.create_repo(token, REPO_NAME)
        workflow_yaml = _build_workflow(settings.docker_image)
        await gh.push_file(
            token, github_username, REPO_NAME,
            ".github/workflows/bot.yml",
            workflow_yaml,
            "AutoShare: update bot workflow",
        )
        await gh.set_secret(token, github_username, REPO_NAME, "GHCR_PAT", settings.ghcr_pat)
    except Exception as e:
        user.status = "error"
        await db.commit()
        raise HTTPException(status_code=500, detail=f"Repo setup failed: {e}")

    jwt_token = create_token(str(user.id))
    return {"token": jwt_token, "github_username": github_username, "status": user.status}


@router.get("/me")
async def me(user: User = Depends(get_current_user)):
    return {
        "id": str(user.id),
        "github_username": user.github_username,
        "github_repo_name": user.github_repo_name,
        "meroshare_dp": user.meroshare_dp,
        "status": user.status,
        "last_run_at": user.last_run_at,
        "last_run_status": user.last_run_status,
    }


def _build_workflow(docker_image: str) -> str:
    nst_hour = random.randint(5, 21)
    utc_minutes = (nst_hour * 60 - 345) % 1440
    cron = f"{utc_minutes % 60} {utc_minutes // 60} * * *"
    suffix = "AM" if nst_hour < 12 else "PM"
    h = nst_hour % 12 or 12
    label = f"{h}:00 {suffix} Nepal time (UTC+5:45)"
    # Pre-generate per-account env var lines (supports up to 8 accounts)
    acct_env = "\n".join(
        f"          MEROSHARE_ACCOUNT_{i}: ${{{{ secrets.MEROSHARE_ACCOUNT_{i} }}}}"
        for i in range(8)
    )
    return f"""\
# AutoShare IPO Bot — auto-generated, do not edit manually
name: AutoShare IPO Bot

on:
  schedule:
    - cron: '{cron}'  # {label}
  workflow_dispatch:

jobs:
  apply-ipo:
    runs-on: ubuntu-latest
    timeout-minutes: 20

    steps:
      - name: Login to GitHub Container Registry
        run: echo "${{{{ secrets.GHCR_PAT }}}}" | docker login ghcr.io -u nepnpc --password-stdin

      - name: Apply for open IPOs
        env:
{acct_env}
          AUTOSHARE_WEBHOOK: ${{{{ secrets.AUTOSHARE_WEBHOOK }}}}
        run: |
          python3 -c "import os,json;a=[json.loads(v) for i in range(8) if (v:=os.environ.get('MEROSHARE_ACCOUNT_'+str(i),''))];print(json.dumps(a))" > /tmp/accounts.json
          docker run --rm \\
            -e MEROSHARE_ACCOUNTS="$(cat /tmp/accounts.json)" \\
            -e AUTOSHARE_WEBHOOK \\
            {docker_image}
"""
