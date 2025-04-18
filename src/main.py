from fastapi import FastAPI, HTTPException, Depends, APIRouter, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from gtts import gTTS
from pydub import AudioSegment
from sqlalchemy.orm import Session
from src.database import SessionLocal, engine
from src.models import Base, User, VocabList
from src.schemas import UserCreate, VocabListCreate, VocabListOut
# from routes.auth_routes import router as auth_router
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from datetime import datetime, timedelta, timezone
from typing import List
import os
import uuid  # For unique filenames to avoid overwrites

SECRET_KEY = "mysecretkey" #use env variable in prod
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

app = FastAPI()
# router = APIRouter()

#allow cors
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=['*'],
)


app.mount("/audio", StaticFiles(directory="audio"), name="audio")

#create all tables created in models.py
Base.metadata.create_all(bind=engine)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

#dependancy to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    print(f"[DEBUG] Token recieved: {token}")

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        #decode the token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"[DEBUG] Payload decoded: {payload}")
        user_email: str = payload.get("sub")
        if user_email is None:
            print("[DEBUG] No user ID in token payload")
            raise credentials_exception
    except JWTError as e:
        print(f"[DEBUG] JWT Error: {str(e)}")
        raise credentials_exception
    
    #look up user in database
    user = db.query(User).filter(User.email == user_email).first()
    if user is None:
        print("[DEBUG] User not found in DB")
        raise credentials_exception
    print(f"[DEBUG] User found: {user.email}")
    return user 



#create register API route (new user)
@app.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    print(f"[DEBUG] Attempting to register user: {user.email}")
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        print(f"[DEBUG] User already exists")
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_pw = pwd_context.hash(user.password)
    new_user = User(email=user.email, hashed_password=hashed_pw)
    db.add(new_user)
    print("[Debug] User added to session")
    db.commit()
    print("[Debug] Session committed.")
    db.refresh(new_user)
    print(f"New user ID: {new_user.id}")
    return {"message": "User registered successfully"}

#create login route + JWT
def authenticate_user(db: Session, email: str, password: str):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return False
    if not pwd_context.verify(password, user.hashed_password):
        return False
    return user

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

#pydantic model to define expected request data 
class VocabPair(BaseModel):
    English: str
    Vietnamese: str 

class VocabListRequest(BaseModel):
    vocab: list[VocabPair]

#generate audio for saved list 
def generate_audio_for_list(vocab_data, list_id):
    combined_audio = AudioSegment.silent(duration=500)
    temp_folder = "audio"
    os.makedirs(temp_folder, exist_ok=True)

    for pair in vocab_data:
        english = pair['English'].strip()
        vietnamese = pair['Vietnamese'].strip()

        if not english or not vietnamese:
            continue

        tts_en = gTTS(text=english, lang='en')
        tts_vi = gTTS(text=vietnamese, lang='vi')

        temp_en = f"{uuid.uuid4()}_en.mp3"
        temp_vi = f"{uuid.uuid4()}_vi.mp3"
        tts_en.save(temp_en)
        tts_vi.save(temp_vi)

        audio_en = AudioSegment.from_mp3(temp_en)
        audio_vi = AudioSegment.from_mp3(temp_vi)
        combined_audio += audio_en + AudioSegment.silent(duration=1000) + audio_vi + AudioSegment.silent(duration=1000)

        os.remove(temp_en)
        os.remove(temp_vi)

    final_filename = os.path.join(temp_folder, f"vocab_audio_{list_id}.mp3")
    combined_audio.export(final_filename, format="mp3")
    return final_filename

@app.post('/generate-audio')
async def generate_audio(data: VocabListRequest):
    vocab_list = data.vocab

    if not vocab_list or not isinstance(vocab_list, list):
        return HTTPException(status_code=400, detail="A list of vocabulary words is required")
    
    # start combined audio segment starting with pause
    combined_audio = AudioSegment.silent(duration=500) 

    temp_folder = "temp_audio"
    os.makedirs(temp_folder, exist_ok=True)

    try:
        for pair in vocab_list:

            print(f"Processing pair: English='{pair.English}', Vietnamese='{pair.Vietnamese}'")

            english_text = pair.English.strip()
            vietnamese_text = pair.Vietnamese.strip()

            if not english_text or not vietnamese_text:
                print("Skipping pair due to empty text.")
                continue  # Skip this iteration if either text is empty

            #generate unique filenames for each audio clip 
            english_filename = os.path.join(temp_folder, f"{uuid.uuid4()}_english.mp3")
            vietnamese_filename = os.path.join(temp_folder, f"{uuid.uuid4()}_vietnamese.mp3")

            #generate tts audio files
            english_tts = gTTS(text=english_text, lang='en')
            viet_tts = gTTS(text=vietnamese_text, lang='vi')

            english_tts.save(english_filename)
            viet_tts.save(vietnamese_filename)

            #convert MP3 to audiosegments
            english_audio = AudioSegment.from_mp3(english_filename)
            vietnamese_audio = AudioSegment.from_mp3(vietnamese_filename)
            pause = AudioSegment.silent(duration=1000) #1 second pause

            combined_audio += english_audio + pause + vietnamese_audio + pause

        # export final combined audio file 
        final_filename = os.path.join(temp_folder, f"{uuid.uuid4()}_vocab_audio.mp3")
        combined_audio.export(final_filename, format="mp3")

        #return the file as a download
        return FileResponse(final_filename, media_type="audio/mpeg", filename="vocab_audio.mp3")

    except Exception as e:
        print(f"Error generating audio: {e}")
        raise HTTPException(status_code=500, detail="Error generating audio.")

    finally:
        #clean up all the temp tables made after sending responce do at the end
        pass


@app.post("/vocab-lists")
def create_vocab_list(vocab_list: VocabListCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    print(f"create vocab list for {current_user.id}")
    print(f"vocab_list: {vocab_list.vocab_data}")
    vocab_data_json = [pair.model_dump() for pair in vocab_list.vocab_data] 
    print (f"vocab_data_json: {vocab_data_json}")    
    db_vocab_list = VocabList(
        name=vocab_list.name, 
        vocab_data=vocab_data_json,
        user_id=current_user.id
    )
    audio_path = generate_audio_for_list(db_vocab_list.vocab_data, db_vocab_list.id)
    db_vocab_list.audio_filename = audio_path
    db.add(db_vocab_list)
    db.commit()
    db.refresh(db_vocab_list)
    return {"message": "Vocab list saved successfully", "id": db_vocab_list.id}

@app.get("/vocab-lists", response_model=List[VocabListOut])
def get_vocab_lists(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    vocab_lists = db.query(VocabList).filter(VocabList.user_id == current_user.id).all()
    return vocab_lists

@app.put("/vocab-lists/{list_id}")
def update_vocab_list(list_id: int, updated_list: VocabListCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    print(f"updating list_id: {list_id}")
    vocab_list = db.query(VocabList).filter(VocabList.id == list_id).first()

    if vocab_list is None:
        raise HTTPException(status_code=404, detail="List not found or not authorized")

    vocab_list.name = updated_list.name
    vocab_list.vocab_data = [pair.model_dump() for pair in updated_list.vocab_data]

    audio_path = generate_audio_for_list(vocab_list.vocab_data, list_id)
    vocab_list.audio_filename = audio_path

    db.commit()
    db.refresh(vocab_list)
    return {"message": "Vocab list updated", "id": vocab_list.id}








