#using sqlalchemy to talk to databasee using python classes rather than sql 
from sqlalchemy import Column, Integer, String, ForeignKey, JSON
from src.database import Base #from sqlalchemy setup 
from sqlalchemy.orm import relationship

class User(Base):
    __tablename__ = "users"

    id=Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String, nullable=False)

    vocab_lists = relationship("VocabList", back_populates="owner")

class VocabList(Base):
    __tablename__ = "vocab_lists"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    vocab_data = Column(JSON, nullable=False) #vocab pairs are stored as JSON 
    user_id = Column(Integer, ForeignKey('users.id'))
    audio_filename = Column(String, nullable=True)

    owner = relationship("User", back_populates="vocab_lists")
