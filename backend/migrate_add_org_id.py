"""
Fix missing organization_id column in products table.
The Product model has organization_id but the SQLite DB was seeded without it.
"""
import sys
sys.path.insert(0, 'backend')
from app.db.session import engine
from sqlalchemy import text

with engine.connect() as conn:
    # Check if column already exists
    result = conn.execute(text("PRAGMA table_info(products)"))
    columns = [row[1] for row in result]
    print("Existing columns:", columns)
    
    if 'organization_id' not in columns:
        print("Adding organization_id column...")
        conn.execute(text("ALTER TABLE products ADD COLUMN organization_id VARCHAR(36) REFERENCES organizations(id)"))
        conn.commit()
        print("Done! organization_id column added.")
    else:
        print("organization_id already exists.")

    # Verify
    result = conn.execute(text("PRAGMA table_info(products)"))
    columns = [row[1] for row in result]
    print("Updated columns:", columns)

print("Migration complete.")
