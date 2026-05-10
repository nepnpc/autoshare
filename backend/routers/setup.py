import json
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from config import settings
from database import get_db
from models import User, AccountMeta
from services import github as gh
from services.crypto import decrypt
from auth_utils import get_current_user
from limiter import limiter

router = APIRouter(prefix="/setup", tags=["setup"])


class Account(BaseModel):
    dp: str
    meroshare_user: str
    meroshare_pass: str = ""  # blank = keep existing secret
    crn: str
    pin: str


class CredentialsRequest(BaseModel):
    accounts: list[Account]


@router.get("/accounts")
async def get_accounts(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AccountMeta)
        .where(AccountMeta.user_id == user.id)
        .order_by(AccountMeta.position)
    )
    rows = result.scalars().all()
    return {
        "accounts": [{"dp": r.dp, "meroshare_user": r.meroshare_user, "crn": r.crn or ""} for r in rows]
    }


@router.post("/credentials")
@limiter.limit("10/minute")
async def save_credentials(
    request: Request,
    body: CredentialsRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not body.accounts:
        raise HTTPException(status_code=400, detail="At least one account required")
    if not user.github_access_token_enc or not user.github_repo_name:
        raise HTTPException(status_code=400, detail="GitHub repo not set up yet")

    token = decrypt(user.github_access_token_enc)
    owner = user.github_username
    repo = user.github_repo_name

    try:
        for i, a in enumerate(body.accounts):
            if a.meroshare_pass:
                account_data = json.dumps({
                    "dp":       a.dp,
                    "username": a.meroshare_user,
                    "password": a.meroshare_pass,
                    "crn":      a.crn,
                    "pin":      a.pin,
                })
                await gh.set_secret(token, owner, repo, f"MEROSHARE_ACCOUNT_{i}", account_data)
        await gh.set_secret(
            token, owner, repo,
            "AUTOSHARE_WEBHOOK",
            f"{settings.backend_url}/webhook/run?token={user.webhook_token}",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to set secrets: {e}")

    # Replace account metadata (non-sensitive: dp + username only)
    await db.execute(delete(AccountMeta).where(AccountMeta.user_id == user.id))
    for i, a in enumerate(body.accounts):
        db.add(AccountMeta(user_id=user.id, dp=a.dp, meroshare_user=a.meroshare_user, crn=a.crn, position=i))

    user.meroshare_dp = body.accounts[0].dp
    user.status = "active"
    await db.commit()

    await _push_staggered_workflows(token, owner, repo, len(body.accounts))

    return {
        "status": "active",
        "accounts": len(body.accounts),
        "message": f"{len(body.accounts)} account(s) activated. Bot runs daily automatically.",
    }


async def _push_staggered_workflows(token: str, owner: str, repo: str, n: int) -> None:
    from routers.auth import _build_workflow_for_account, _compute_base_minute
    base_minute = _compute_base_minute(n)
    # Delete stale files (best effort)
    stale = [".github/workflows/bot.yml"] + [f".github/workflows/bot-{i}.yml" for i in range(8)]
    for path in stale:
        try:
            await gh.delete_file(token, owner, repo, path)
        except Exception:
            pass
    # Push per-account workflow files
    for i in range(n):
        try:
            await gh.push_file(
                token, owner, repo,
                f".github/workflows/bot-{i}.yml",
                _build_workflow_for_account(settings.docker_image, i, n, base_minute),
                f"AutoShare: update workflow (account {i})",
            )
        except Exception:
            pass


@router.post("/refresh-workflow")
async def refresh_workflow(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Re-push the latest per-account workflow YAMLs to the user's repo."""
    if not user.github_access_token_enc or not user.github_repo_name:
        raise HTTPException(status_code=400, detail="GitHub repo not set up yet")
    token = decrypt(user.github_access_token_enc)
    result = await db.execute(
        select(AccountMeta).where(AccountMeta.user_id == user.id).order_by(AccountMeta.position)
    )
    n = len(result.scalars().all()) or 1
    try:
        await _push_staggered_workflows(token, user.github_username, user.github_repo_name, n)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update workflows: {e}")
    return {"status": "ok", "message": f"Workflows updated for {n} account(s). Re-trigger the bot run."}


@router.delete("/accounts/{position}")
async def delete_account_entry(
    position: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove one account and re-push updated secrets to GitHub."""
    if not user.github_access_token_enc or not user.github_repo_name:
        raise HTTPException(status_code=400, detail="GitHub repo not set up yet")

    result = await db.execute(
        select(AccountMeta)
        .where(AccountMeta.user_id == user.id)
        .order_by(AccountMeta.position)
    )
    rows = result.scalars().all()
    if position < 0 or position >= len(rows):
        raise HTTPException(status_code=404, detail="Account not found")
    if len(rows) == 1:
        raise HTTPException(status_code=400, detail="Cannot delete last account — update instead")

    # We can only delete the metadata; the actual secrets need a full re-push with passwords.
    # So we just remove the metadata entry and mark status as needs_update.
    await db.delete(rows[position])
    # Re-number remaining
    for i, row in enumerate(r for j, r in enumerate(rows) if j != position):
        row.position = i
    user.status = "needs_update"
    await db.commit()

    return {"message": "Account removed from list. Re-enter remaining accounts to update GitHub secrets."}
