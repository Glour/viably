"""create artifacts table

Revision ID: j0k1l2m3n4o5
Revises: i9j0k1l2m3n4
Create Date: 2026-02-09 18:32:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'j0k1l2m3n4o5'
down_revision: Union[str, Sequence[str], None] = 'i9j0k1l2m3n4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: Create artifacts table."""
    op.create_table(
        'artifacts',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('conversation_id', sa.UUID(), nullable=False),
        sa.Column('message_id', sa.UUID(), nullable=False),
        sa.Column('type', sa.String(length=50), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('language', sa.String(length=50), nullable=True),
        sa.Column('version', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('parent_artifact_id', sa.UUID(), nullable=True),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(['conversation_id'], ['conversations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['message_id'], ['messages.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['parent_artifact_id'], ['artifacts.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )

    # Create indexes for common queries
    op.create_index('idx_artifacts_conversation_id', 'artifacts', ['conversation_id'], unique=False)
    op.create_index('idx_artifacts_message_id', 'artifacts', ['message_id'], unique=False)
    op.create_index('idx_artifacts_parent_id', 'artifacts', ['parent_artifact_id'], unique=False)
    op.create_index(
        'idx_artifacts_created_at',
        'artifacts',
        [sa.text('created_at DESC')],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema: Drop artifacts table."""
    op.drop_index('idx_artifacts_created_at', table_name='artifacts')
    op.drop_index('idx_artifacts_parent_id', table_name='artifacts')
    op.drop_index('idx_artifacts_message_id', table_name='artifacts')
    op.drop_index('idx_artifacts_conversation_id', table_name='artifacts')
    op.drop_table('artifacts')
