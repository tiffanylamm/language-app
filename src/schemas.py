from pydantic import BaseModel
from typing import List

class UserCreate(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class VocabPair(BaseModel):
    English: str
    Vietnamese: str

    class Config:
        orm_mod = True

class VocabListCreate(BaseModel):
    name: str
    vocab_data: List[VocabPair]

class VocabListOut(BaseModel):
    id: int
    name: str
    vocab_data: List[VocabPair]
    audio_filename: str


    #allow read data from ORM objects not just python objects(reads attributes rather than dict keys)
    class Config:
        orm_mode = True