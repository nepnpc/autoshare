from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models import User, IpoRun
from services import github as gh
from services.crypto import decrypt
from auth_utils import get_current_user

router = APIRouter(tags=["status"])


@router.get("/status")
async def get_status(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(IpoRun)
        .where(IpoRun.user_id == user.id)
        .order_by(IpoRun.run_at.desc())
        .limit(20)
    )
    runs = result.scalars().all()
    return {
        "status": user.status,
        "run_hour_nst": user.run_hour_nst,
        "last_run_at": user.last_run_at,
        "last_run_status": user.last_run_status,
        "runs": [
            {
                "ipo_name": r.ipo_name,
                "run_at": r.run_at,
                "status": r.status,
                "error_message": r.error_message,
            }
            for r in runs
        ],
    }


@router.post("/bot/trigger")
async def trigger_bot(user: User = Depends(get_current_user)):
    if user.status != "active":
        raise HTTPException(status_code=400, detail="Bot not active — complete setup first")
    if not user.github_access_token_enc:
        raise HTTPException(status_code=400, detail="No GitHub token")

    token = decrypt(user.github_access_token_enc)
    try:
        await gh.trigger_workflow(token, user.github_username, user.github_repo_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Trigger failed: {e}")

    return {"message": "Bot triggered. Check GitHub Actions in ~30 seconds."}


@router.delete("/account")
async def delete_account(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if user.github_access_token_enc and user.github_repo_name:
        token = decrypt(user.github_access_token_enc)
        try:
            await gh.delete_repo(token, user.github_username, user.github_repo_name)
        except Exception:
            pass

    await db.execute(delete(IpoRun).where(IpoRun.user_id == user.id))
    await db.delete(user)
    await db.commit()
    return {"message": "Account deleted"}
