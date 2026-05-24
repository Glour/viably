"""fix_email_logs_constraints

Revision ID: g7h8i9j0k1l2
Revises: f6g7h8i9j0k1
Create Date: 2026-02-08 20:45:00.000000

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "g7h8i9j0k1l2"
down_revision: Union[str, None] = "f6g7h8i9j0k1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop old constraints
    op.drop_constraint("email_logs_email_type_check", "email_logs", type_="check")
    op.drop_constraint("email_logs_status_check", "email_logs", type_="check")

    # Add new constraints with lowercase values
    op.create_check_constraint(
        "email_logs_email_type_check",
        "email_logs",
        "email_type IN ('welcome', 'generation_complete', 'deploy_success', 'low_credits')",
    )
    op.create_check_constraint(
        "email_logs_status_check",
        "email_logs",
        "status IN ('pending', 'sent', 'failed', 'bounced')",
    )


def downgrade() -> None:
    # Drop lowercase constraints
    op.drop_constraint("email_logs_email_type_check", "email_logs", type_="check")
    op.drop_constraint("email_logs_status_check", "email_logs", type_="check")

    # Restore original uppercase constraints
    op.create_check_constraint(
        "email_logs_email_type_check",
        "email_logs",
        "email_type IN ('WELCOME', 'GENERATION_COMPLETE', 'DEPLOY_SUCCESS', 'LOW_CREDITS')",
    )
    op.create_check_constraint(
        "email_logs_status_check",
        "email_logs",
        "status IN ('PENDING', 'SENT', 'FAILED', 'BOUNCED')",
    )
