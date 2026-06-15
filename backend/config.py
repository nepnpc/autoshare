from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    database_url: str
    github_client_id: str
    github_client_secret: str
    encryption_key: str
    jwt_secret: str
    frontend_url: str = "http://localhost:3000"
    backend_url: str = "http://localhost:8000"
    docker_image: str = "ghcr.io/nepnpc/autoshare-bot:latest"

    jwt_algorithm: str = "HS256"
    jwt_expire_days: int = 30


settings = Settings()
