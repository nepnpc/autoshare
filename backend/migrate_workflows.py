"""
One-off migration: re-push login-free workflow YAMLs to all existing user repos.

Why: workflows pushed before the GHCR-public change still contain the
`docker login ghcr.io` step, which fails (denied) and aborts the job even
though the image is now public. This re-pushes the current login-free
workflow to every active user's repo.

Run from the backend/ directory on the VM:
    python migrate_workflows.py

Reads DATABASE_URL and ENCRYPTION_KEY from backend/.env.
Users whose GitHub OAuth token was revoked will FAIL — they must reconnect
via the site.
"""
import asyncio
from collections import defaultdict

from config import settings
from cryptography.fernet import Fernet
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine as _create_engine

from routers.auth import _build_workflow_for_account, _compute_base_minute
from services import github as gh

_fernet = Fernet(settings.encryption_key.encode())


def decrypt(token_enc: str) -> str:
    return _fernet.decrypt(token_enc.encode()).decode()


async def push_for_user(owner: str, repo: str, token: str, n: int) -> None:
    n = max(n, 1)
    base_minute = _compute_base_minute(n)
    # Delete stale workflow files (best effort)
    stale = [".github/workflows/bot.yml"] + [f".github/workflows/bot-{i}.yml" for i in range(8)]
    for path in stale:
        try:
            await gh.delete_file(token, owner, repo, path)
        except Exception:
            pass
    # Push fresh login-free per-account workflows
    for i in range(n):
        await gh.push_file(
            token, owner, repo,
            f".github/workflows/bot-{i}.yml",
            _build_workflow_for_account(settings.docker_image, i, n, base_minute),
            f"AutoShare: migrate workflow to login-free (account {i})",
        )


async def main():
    ssl_args = {"ssl": "require"} if "supabase" in settings.database_url else {}
    engine = _create_engine(settings.database_url, connect_args=ssl_args)

    async with engine.connect() as conn:
        users = (await conn.execute(text(
            "SELECT id, github_username, github_repo_name, github_access_token_enc "
            "FROM users "
            "WHERE status = 'active' AND github_access_token_enc IS NOT NULL "
            "AND github_repo_name IS NOT NULL"
        ))).fetchall()

        counts = defaultdict(int)
        for uid, cnt in (await conn.execute(text(
            "SELECT user_id, COUNT(*) FROM account_meta GROUP BY user_id"
        ))).fetchall():
            counts[uid] = cnt

    print(f"Found {len(users)} active users")
    ok, failed = 0, []

    for uid, username, repo, token_enc in users:
        try:
            token = decrypt(token_enc)
            await push_for_user(username, repo, token, counts.get(uid, 1))
            print(f"  OK   {username}/{repo} ({counts.get(uid, 1)} account(s))")
            ok += 1
        except Exception as e:
            print(f"  FAIL {username}/{repo}: {e}")
            failed.append(username)

    print(f"\nDone. {ok} migrated, {len(failed)} failed.")
    if failed:
        print("Failed (OAuth token likely revoked — they must reconnect via site):")
        for u in failed:
            print(f"  {u}")


asyncio.run(main())
