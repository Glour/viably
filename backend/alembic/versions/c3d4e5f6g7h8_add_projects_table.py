"""add projects table

Revision ID: c3d4e5f6g7h8
Revises: b2c3d4e5f6g7
Create Date: 2026-02-05 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'c3d4e5f6g7h8'
down_revision: Union[str, Sequence[str], None] = 'b2c3d4e5f6g7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('projects',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('template_id', sa.UUID(), nullable=False),
        sa.Column('config', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('generated_code', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('generation_logs', sa.Text(), nullable=True),
        sa.Column('ai_model_used', sa.String(length=50), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='draft'),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('deployed_url', sa.Text(), nullable=True),
        sa.Column('deploy_platform', sa.String(length=50), nullable=True),
        sa.Column('is_public', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('generated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('deployed_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['template_id'], ['templates.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('projects_user_id_idx', 'projects', ['user_id'], unique=False)
    op.create_index('projects_status_idx', 'projects', ['status'], unique=False)
    op.create_index('projects_template_id_idx', 'projects', ['template_id'], unique=False)
    op.create_index('projects_created_at_idx', 'projects', [sa.text('created_at DESC')], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('projects_created_at_idx', table_name='projects')
    op.drop_index('projects_template_id_idx', table_name='projects')
    op.drop_index('projects_status_idx', table_name='projects')
    op.drop_index('projects_user_id_idx', table_name='projects')
    op.drop_table('projects')
