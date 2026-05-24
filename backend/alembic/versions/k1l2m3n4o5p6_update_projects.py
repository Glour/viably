"""update projects table for conversations

Revision ID: k1l2m3n4o5p6
Revises: j0k1l2m3n4o5
Create Date: 2026-02-09 18:33:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'k1l2m3n4o5p6'
down_revision: Union[str, Sequence[str], None] = 'j0k1l2m3n4o5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: Add conversation support to projects table."""
    # Add allow_empty column (for empty projects without templates)
    op.add_column(
        'projects',
        sa.Column('allow_empty', sa.Boolean(), nullable=False, server_default='false'),
    )

    # Add current_conversation_id column (tracks active conversation)
    op.add_column(
        'projects',
        sa.Column('current_conversation_id', sa.UUID(), nullable=True),
    )

    # Create foreign key to conversations
    op.create_foreign_key(
        'fk_projects_current_conversation_id',
        'projects',
        'conversations',
        ['current_conversation_id'],
        ['id'],
        ondelete='SET NULL',
    )

    # Make template_id nullable (allow null for empty projects)
    op.alter_column(
        'projects',
        'template_id',
        existing_type=sa.UUID(),
        nullable=True,
    )


def downgrade() -> None:
    """Downgrade schema: Remove conversation support from projects table."""
    # Drop foreign key constraint
    op.drop_constraint('fk_projects_current_conversation_id', 'projects', type_='foreignkey')

    # Make template_id NOT NULL again
    op.alter_column(
        'projects',
        'template_id',
        existing_type=sa.UUID(),
        nullable=False,
    )

    # Drop columns
    op.drop_column('projects', 'current_conversation_id')
    op.drop_column('projects', 'allow_empty')
