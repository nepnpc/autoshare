import uuid
from datetime import datetime
from sqlalchemy import String, BigInteger, DateTime, Text, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    github_user_id: Mapped[int] = mapped_column(BigInteger, unique=True, nullable=False)
    github_username: Mapped[str] = mapped_column(String, nullable=False)
    github_access_token_enc: Mapped[str | None] = mapped_column(Text)
    github_repo_name: Mapped[str | None] = mapped_column(String)
    webhook_token: Mapped[str | None] = mapped_column(String)
    meroshare_dp: Mapped[str | None] = mapped_column(String)
    status: Mapped[str] = mapped_column(String, default="pending")  # pending | active | error
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    last_run_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_run_status: Mapped[str | None] = mapped_column(String)


class AccountMeta(Base):
    """Stores non-sensitive account identifiers so users can see/manage their accounts.
    Passwords and PINs are NEVER stored here — only in GitHub Secrets."""
    __tablename__ = "account_meta"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    dp: Mapped[str] = mapped_column(String, nullable=False)
    meroshare_user: Mapped[str] = mapped_column(String, nullable=False)
    crn: Mapped[str | None] = mapped_column(String)
    position: Mapped[int] = mapped_column(Integer, default=0)


class IpoRun(Base):
    __tablename__ = "ipo_runs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    ipo_name: Mapped[str | None] = mapped_column(String)
    run_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    status: Mapped[str | None] = mapped_column(String)  # applied | already_applied | error | no_ipos
    error_message: Mapped[str | None] = mapped_column(Text)
