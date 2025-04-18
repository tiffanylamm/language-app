from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, '../test.db')}"
print(f"Database path: {os.path.join(BASE_DIR, '../test.db')}")


#establishes core connection to database, connection args is specific to sqllite
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
#sessionmaker is a factory that creates new sessions(workspace to query the database, add new records, commit changes)
# factory = function that crates instances of objects 
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
#base class for ORM models, SQLAlchemy uses base to track all models and meetadata
Base = declarative_base()