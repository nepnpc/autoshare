import base64
from base64 import b64encode
import httpx
from nacl import encoding, public


BASE = "https://api.github.com"
HEADERS = {"Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"}


def _auth(token: str) -> dict:
    return {**HEADERS, "Authorization": f"Bearer {token}"}


async def exchange_code(client_id: str, client_secret: str, code: str) -> str:
    async with httpx.AsyncClient() as c:
        r = await c.post(
            "https://github.com/login/oauth/access_token",
            json={"client_id": client_id, "client_secret": client_secret, "code": code},
            headers={"Accept": "application/json"},
        )
        r.raise_for_status()
        data = r.json()
        token = data.get("access_token")
        if not token:
            raise ValueError(f"OAuth failed: {data.get('error_description', data)}")
        return token


async def get_user(token: str) -> dict:
    async with httpx.AsyncClient() as c:
        r = await c.get(f"{BASE}/user", headers=_auth(token))
        r.raise_for_status()
        return r.json()


async def create_repo(token: str, repo_name: str) -> dict:
    async with httpx.AsyncClient() as c:
        r = await c.post(
            f"{BASE}/user/repos",
            headers=_auth(token),
            json={"name": repo_name, "private": True, "auto_init": True, "description": "AutoShare IPO bot — do not delete"},
        )
        if r.status_code == 422:
            # Repo already exists — fetch it
            user_data = await get_user(token)
            r2 = await c.get(f"{BASE}/repos/{user_data['login']}/{repo_name}", headers=_auth(token))
            r2.raise_for_status()
            return r2.json()
        r.raise_for_status()
        return r.json()


async def push_file(token: str, owner: str, repo: str, path: str, content: str, message: str) -> None:
    encoded = base64.b64encode(content.encode()).decode()
    async with httpx.AsyncClient() as c:
        # Get existing SHA if file exists (needed for update)
        sha = None
        r = await c.get(f"{BASE}/repos/{owner}/{repo}/contents/{path}", headers=_auth(token))
        if r.status_code == 200:
            sha = r.json().get("sha")

        payload = {"message": message, "content": encoded}
        if sha:
            payload["sha"] = sha

        r2 = await c.put(
            f"{BASE}/repos/{owner}/{repo}/contents/{path}",
            headers=_auth(token),
            json=payload,
        )
        r2.raise_for_status()


def _encrypt_secret(public_key_b64: str, secret_value: str) -> str:
    pk = public.PublicKey(public_key_b64.encode(), encoding.Base64Encoder())
    box = public.SealedBox(pk)
    encrypted = box.encrypt(secret_value.encode())
    return b64encode(encrypted).decode()


async def set_secret(token: str, owner: str, repo: str, name: str, value: str) -> None:
    async with httpx.AsyncClient() as c:
        r = await c.get(f"{BASE}/repos/{owner}/{repo}/actions/secrets/public-key", headers=_auth(token))
        r.raise_for_status()
        key_data = r.json()

        encrypted = _encrypt_secret(key_data["key"], value)
        r2 = await c.put(
            f"{BASE}/repos/{owner}/{repo}/actions/secrets/{name}",
            headers=_auth(token),
            json={"encrypted_value": encrypted, "key_id": key_data["key_id"]},
        )
        r2.raise_for_status()


async def delete_file(token: str, owner: str, repo: str, path: str) -> None:
    async with httpx.AsyncClient() as c:
        r = await c.get(f"{BASE}/repos/{owner}/{repo}/contents/{path}", headers=_auth(token))
        if r.status_code == 404:
            return
        r.raise_for_status()
        sha = r.json()["sha"]
        r2 = await c.delete(
            f"{BASE}/repos/{owner}/{repo}/contents/{path}",
            headers=_auth(token),
            json={"message": f"AutoShare: remove {path}", "sha": sha},
        )
        if r2.status_code not in (200, 404):
            r2.raise_for_status()


async def trigger_workflow(token: str, owner: str, repo: str, workflow_id: str = "bot.yml") -> None:
    async with httpx.AsyncClient() as c:
        r = await c.post(
            f"{BASE}/repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches",
            headers=_auth(token),
            json={"ref": "main"},
        )
        r.raise_for_status()


async def list_workflow_runs(token: str, owner: str, repo: str, limit: int = 10) -> list:
    async with httpx.AsyncClient() as c:
        r = await c.get(
            f"{BASE}/repos/{owner}/{repo}/actions/runs",
            headers=_auth(token),
            params={"per_page": limit},
        )
        r.raise_for_status()
        return r.json().get("workflow_runs", [])


async def delete_repo(token: str, owner: str, repo: str) -> None:
    async with httpx.AsyncClient() as c:
        r = await c.delete(f"{BASE}/repos/{owner}/{repo}", headers=_auth(token))
        if r.status_code not in (204, 404):
            r.raise_for_status()
