import sys
sys.path.insert(0, 'backend')
from app.db.session import engine
from sqlalchemy import inspect, text

inspector = inspect(engine)
print('Tables:', inspector.get_table_names())
print()
print('Products columns:')
for col in inspector.get_columns('products'):
    print(f"  {col['name']} ({col['type']})")
