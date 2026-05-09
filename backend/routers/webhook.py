from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models import User, IpoRun

router = APIRouter(prefix="/webhook", tags=["webhook"])


class BotResult(BaseModel):
    account: str
    applied: int
    failed: int
    no_ipos: bool
    results: list[dict]


@router.post("/run")
async def run_complete(
    body: BotResult,
    token: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.webhook_token == token))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=403, detail="Invalid webhook token")

    now = datetime.now(timezone.utc)

    if body.no_ipos:
        run_status = "no_ipos"
    elif body.failed > 0 and body.applied == 0:
        run_status = "error"
    elif body.applied > 0:
        run_status = "applied"
    else:
        run_status = "already_applied"

    user.last_run_at = now
    user.last_run_status = run_status

    for r in body.results:
        db.add(IpoRun(
            user_id=user.id,
            ipo_name=r.get("ipo_name"),
            run_at=now,
            status="applied" if r.get("success") else "error",
            error_message=r.get("error"),
        ))

    if body.no_ipos:
        db.add(IpoRun(user_id=user.id, run_at=now, status="no_ipos"))

    await db.commit()
    return {"ok": True}
