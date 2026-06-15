"""
One-off: manually trigger (workflow_dispatch) every account's bot workflow
for all active users — right now. Use when bots were down and you need an
immediate run (e.g. last day of an IPO).

Run from backend/ with the venv:
    ./venv/bin/python trigger_all_now.py

Reads DATABASE_URL + ENCRYPTION_KEY from backend/.env.
"""
import asyncio
from collections import defaultdict

from config import settings
from cryptography.fernet import Fernet
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from services import github as gh

_fernet = Fernet(settings.encryption_key.encode())


def decrypt(token_enc: str) -> str:
    return _fernet.decrypt(token_enc.encode()).decode()


async def main():
    ssl_args = {"ssl": "require"} if "supabase" in settings.database_url else {}
    engine = create_async_engine(settings.database_url, connect_args=ssl_args)

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
    fired, failed = 0, []

    for uid, username, repo, token_enc in users:
        token = decrypt(token_enc)
        n = max(counts.get(uid, 1), 1)
        for i in range(n):
            wf = f"bot-{i}.yml"
            try:
                await gh.trigger_workflow(token, username, repo, wf)
                print(f"  FIRED {username}/{repo} {wf}")
                fired += 1
            except Exception as e:
                print(f"  FAIL  {username}/{repo} {wf}: {e}")
                failed.append(f"{username}/{wf}")

    print(f"\nDone. {fired} workflows triggered, {len(failed)} failed.")
    if failed:
        for f in failed:
            print(f"  {f}")


asyncio.run(main())
