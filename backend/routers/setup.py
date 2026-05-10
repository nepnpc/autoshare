import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from config import settings
from database import get_db
from models import User, AccountMeta
from services import github as gh
from services.crypto import decrypt
from auth_utils import get_current_user

router = APIRouter(prefix="/setup", tags=["setup"])


class Account(BaseModel):
    dp: str
    meroshare_user: str
    meroshare_pass: str = ""  # blank = keep existing secret
    crn: str
    pin: str


class CredentialsRequest(BaseModel):
    accounts: list[Account]
    run_hour: int = 6  # NST hour (0-23), default 6 AM


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
async def save_credentials(
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
    user.run_hour_nst = body.run_hour
    await db.commit()

    # Re-push workflow with updated cron schedule
    from routers.auth import _build_workflow, _fmt_nst
    try:
        await gh.push_file(
            token, owner, repo,
            ".github/workflows/bot.yml",
            _build_workflow(settings.docker_image, nst_hour=body.run_hour),
            f"AutoShare: update schedule to {_fmt_nst(body.run_hour)}",
        )
    except Exception:
        pass  # Non-fatal: secrets saved, workflow update can retry

    return {
        "status": "active",
        "accounts": len(body.accounts),
        "run_hour_nst": body.run_hour,
        "message": f"{len(body.accounts)} account(s) activated. Bot runs daily at {_fmt_nst(body.run_hour)}.",
    }


@router.post("/refresh-workflow")
async def refresh_workflow(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Re-push the latest workflow YAML to the user's repo."""
    if not user.github_access_token_enc or not user.github_repo_name:
        raise HTTPException(status_code=400, detail="GitHub repo not set up yet")
    from routers.auth import _build_workflow
    token = decrypt(user.github_access_token_enc)
    try:
        await gh.push_file(
            token, user.github_username, user.github_repo_name,
            ".github/workflows/bot.yml",
            _build_workflow(settings.docker_image),
            "AutoShare: refresh bot workflow",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update workflow: {e}")
    return {"status": "ok", "message": "Workflow updated. Re-trigger the bot run."}


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
