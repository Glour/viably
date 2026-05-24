"""Add OAuth fields to users table.

Revision ID: add_oauth_fields_001
Revises: add_payments_001
Create Date: 2026-02-15
"""
from alembic import op
import sqlalchemy as sa

revision = 'add_oauth_fields_001'
down_revision = 'add_payments_001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add OAuth fields: github_access_token and oauth_provider."""
    # Add github_access_token for GitHub API integration
    op.add_column(
        'users',
        sa.Column('github_access_token', sa.String(255), nullable=True)
    )
    
    # Add oauth_provider to track which OAuth provider was used (google, github, or None for email/password)
    op.add_column(
        'users',
        sa.Column('oauth_provider', sa.String(20), nullable=True)
    )
    
    # Add github_username for display purposes
    op.add_column(
        'users',
        sa.Column('github_username', sa.String(100), nullable=True)
    )


def downgrade() -> None:
    """Remove OAuth fields."""
    op.drop_column('users', 'github_username')
    op.drop_column('users', 'oauth_provider')
    op.drop_column('users', 'github_access_token')
