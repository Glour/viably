"""Add custom_domain to deployments table.

Revision ID: o5p6q7r8s9t0
Revises: n4o5p6q7r8s9
Create Date: 2026-02-20
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "o5p6q7r8s9t0"
down_revision: Union[str, Sequence[str], None] = "n4o5p6q7r8s9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "deployments",
        sa.Column("custom_domain", sa.Text(), nullable=True),
    )
    op.create_index(
        "deployments_custom_domain_idx",
        "deployments",
        ["custom_domain"],
        unique=True,
        postgresql_where=sa.text("custom_domain IS NOT NULL"),
    )


def downgrade() -> None:
    op.drop_index("deployments_custom_domain_idx", table_name="deployments")
    op.drop_column("deployments", "custom_domain")
