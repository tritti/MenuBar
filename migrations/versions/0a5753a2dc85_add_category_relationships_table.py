"""Add category relationships table

Revision ID: 0a5753a2dc85
Revises: ffc1532a8e06
Create Date: 2025-03-12 12:33:02.472718

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0a5753a2dc85'
down_revision = 'ffc1532a8e06'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('category', schema=None) as batch_op:
        batch_op.drop_constraint(None, type_='foreignkey')
        batch_op.drop_column('parent_id')

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('category', schema=None) as batch_op:
        batch_op.add_column(sa.Column('parent_id', sa.INTEGER(), nullable=True))
        batch_op.create_foreign_key(None, 'category', ['parent_id'], ['id'])

    # ### end Alembic commands ###
