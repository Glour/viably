"""add_email_logs_table

Revision ID: f6g7h8i9j0k1
Revises: e5f6g7h8i9j0
Create Date: 2026-02-08 12:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "f6g7h8i9j0k1"
down_revision: Union[str, None] = "e5f6g7h8i9j0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "email_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("email_type", sa.String(50), nullable=False),
        sa.Column("recipient_email", sa.String(255), nullable=False),
        sa.Column("subject", sa.String(200), nullable=False),
        sa.Column("template_variables", postgresql.JSONB(), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="PENDING"),
        sa.Column("error_message", sa.String(500), nullable=True),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("resend_message_id", sa.String(100), nullable=True),
        sa.CheckConstraint(
            "email_type IN ('WELCOME', 'GENERATION_COMPLETE', 'DEPLOY_SUCCESS', 'LOW_CREDITS')",
            name="email_logs_email_type_check",
        ),
        sa.CheckConstraint(
            "status IN ('PENDING', 'SENT', 'FAILED', 'BOUNCED')",
            name="email_logs_status_check",
        ),
    )

    # Create indexes
    op.create_index("idx_email_logs_user_id", "email_logs", ["user_id"])
    op.create_index(
        "idx_email_logs_user_created",
        "email_logs",
        ["user_id", sa.text("created_at DESC")],
    )
    op.create_index(
        "idx_email_logs_type_status", "email_logs", ["email_type", "status"]
    )
    op.create_index(
        "idx_email_logs_status_created",
        "email_logs",
        ["status", "created_at"],
        postgresql_where=sa.text("status IN ('PENDING', 'FAILED')"),
    )


def downgrade() -> None:
    op.drop_index("idx_email_logs_status_created", table_name="email_logs")
    op.drop_index("idx_email_logs_type_status", table_name="email_logs")
    op.drop_index("idx_email_logs_user_created", table_name="email_logs")
    op.drop_index("idx_email_logs_user_id", table_name="email_logs")
    op.drop_table("email_logs")
