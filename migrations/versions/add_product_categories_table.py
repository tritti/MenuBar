"""Add product_categories association table

Revision ID: add_product_categories
Revises: 0a5753a2dc85
Create Date: 2025-03-13 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_product_categories'
down_revision = '0a5753a2dc85'
branch_labels = None
depends_on = None


def upgrade():
    # Create product_categories association table
    op.create_table('product_categories',
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['product_id'], ['product.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['category_id'], ['category.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('product_id', 'category_id')
    )
    
    # Copy existing category relationships
    op.execute("""
        INSERT INTO product_categories (product_id, category_id)
        SELECT id, category_id FROM product WHERE category_id IS NOT NULL
    """)


def downgrade():
    op.drop_table('product_categories')