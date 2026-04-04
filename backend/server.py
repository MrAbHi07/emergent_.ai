from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
import asyncio
from emergentintegrations.llm.chat import LlmChat, UserMessage
import json
from ml_model import analyzer
from voice_service import voice_service

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

JWT_SECRET = os.environ.get('JWT_SECRET', 'default_secret')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    role: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "student"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class GameSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    game_type: str
    score: float
    accuracy: float
    response_time: float
    mistakes: int
    completion_time: float
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class GameSessionCreate(BaseModel):
    game_type: str
    score: float
    accuracy: float
    response_time: float
    mistakes: int
    completion_time: float
    metadata: Optional[Dict[str, Any]] = None

class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    session_id: str
    role: str
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatMessageCreate(BaseModel):
    session_id: str
    message: str

class LearningProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    attention_level: str
    learning_style: str
    reading_difficulty: str
    strengths: List[str] = []
    weaknesses: List[str] = []
    recommendations: List[str] = []
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@api_router.get("/")
async def root():
    return {"message": "NeuroBuddy AI Backend API"}

@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = hash_password(user_data.password)
    user_obj = User(
        email=user_data.email,
        name=user_data.name,
        role=user_data.role
    )
    
    user_dict = user_obj.model_dump()
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    user_dict['password'] = hashed_password
    
    await db.users.insert_one(user_dict)
    
    token = create_access_token({"sub": user_obj.id})
    
    return {"token": token, "user": user_obj}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(credentials.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token({"sub": user['id']})
    
    user_response = User(**user)
    return {"token": token, "user": user_response}

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    return User(**current_user)

@api_router.post("/games/session", response_model=GameSession)
async def create_game_session(session_data: GameSessionCreate, current_user: dict = Depends(get_current_user)):
    session_obj = GameSession(
        user_id=current_user['id'],
        **session_data.model_dump()
    )
    
    session_dict = session_obj.model_dump()
    session_dict['created_at'] = session_dict['created_at'].isoformat()
    
    await db.game_sessions.insert_one(session_dict)
    
    await analyze_and_update_profile(current_user['id'])
    
    return session_obj

@api_router.get("/games/sessions", response_model=List[GameSession])
async def get_game_sessions(current_user: dict = Depends(get_current_user)):
    sessions = await db.game_sessions.find({"user_id": current_user['id']}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    for session in sessions:
        if isinstance(session['created_at'], str):
            session['created_at'] = datetime.fromisoformat(session['created_at'])
    
    return sessions

@api_router.get("/games/stats")
async def get_game_stats(current_user: dict = Depends(get_current_user)):
    sessions = await db.game_sessions.find({"user_id": current_user['id']}, {"_id": 0}).limit(500).to_list(500)
    
    if not sessions:
        return {
            "total_games": 0,
            "average_score": 0,
            "average_accuracy": 0,
            "games_by_type": {}
        }
    
    total_games = len(sessions)
    total_score = sum(s['score'] for s in sessions)
    total_accuracy = sum(s['accuracy'] for s in sessions)
    
    games_by_type = {}
    for session in sessions:
        game_type = session['game_type']
        if game_type not in games_by_type:
            games_by_type[game_type] = {'count': 0, 'avg_score': 0, 'avg_accuracy': 0}
        games_by_type[game_type]['count'] += 1
    
    for game_type in games_by_type:
        type_sessions = [s for s in sessions if s['game_type'] == game_type]
        games_by_type[game_type]['avg_score'] = sum(s['score'] for s in type_sessions) / len(type_sessions)
        games_by_type[game_type]['avg_accuracy'] = sum(s['accuracy'] for s in type_sessions) / len(type_sessions)
    
    return {
        "total_games": total_games,
        "average_score": total_score / total_games,
        "average_accuracy": total_accuracy / total_games,
        "games_by_type": games_by_type
    }

async def analyze_and_update_profile(user_id: str):
    sessions = await db.game_sessions.find({"user_id": user_id}, {"_id": 0}).limit(100).to_list(100)
    
    if len(sessions) < 3:
        return
    
    analysis = analyzer.analyze_performance(sessions)
    
    if not analysis:
        return
    
    profile_obj = LearningProfile(
        user_id=user_id,
        attention_level=analysis['attention_level'],
        learning_style=analysis['learning_style'],
        reading_difficulty=analysis['reading_difficulty'],
        strengths=analysis['strengths'],
        weaknesses=analysis['weaknesses'],
        recommendations=analysis['recommendations']
    )
    
    profile_dict = profile_obj.model_dump()
    profile_dict['updated_at'] = profile_dict['updated_at'].isoformat()
    
    await db.learning_profiles.update_one(
        {"user_id": user_id},
        {"$set": profile_dict},
        upsert=True
    )

@api_router.get("/profile/learning", response_model=LearningProfile)
async def get_learning_profile(current_user: dict = Depends(get_current_user)):
    profile = await db.learning_profiles.find_one({"user_id": current_user['id']}, {"_id": 0})
    
    if not profile:
        raise HTTPException(status_code=404, detail="Learning profile not found. Play more games to generate your profile.")
    
    if isinstance(profile['updated_at'], str):
        profile['updated_at'] = datetime.fromisoformat(profile['updated_at'])
    
    return LearningProfile(**profile)

@api_router.post("/chat/send")
async def send_chat_message(message_data: ChatMessageCreate, current_user: dict = Depends(get_current_user)):
    user_message_obj = ChatMessage(
        user_id=current_user['id'],
        session_id=message_data.session_id,
        role="user",
        content=message_data.message
    )
    
    user_msg_dict = user_message_obj.model_dump()
    user_msg_dict['created_at'] = user_msg_dict['created_at'].isoformat()
    await db.chat_messages.insert_one(user_msg_dict)
    
    # Get learning profile for personalization
    profile = await db.learning_profiles.find_one({"user_id": current_user['id']}, {"_id": 0})
    
    # Get recent chat history for context
    recent_messages = await db.chat_messages.find(
        {"user_id": current_user['id'], "session_id": message_data.session_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(10).to_list(10)
    
    # Analyze conversation for difficulty adjustment
    recent_user_messages = [msg for msg in recent_messages if msg['role'] == 'user']
    confusion_indicators = ['confused', 'don\'t understand', 'what', 'why', 'how', 'explain', 'help']
    is_confused = any(indicator in message_data.message.lower() for indicator in confusion_indicators)
    
    system_message = f"""You are NeuroBuddy, an expert AI tutor specialized in teaching neurodiverse students (Autism, ADHD, Dyslexia). You're patient, encouraging, and adaptive.

🎯 **CORE TEACHING PHILOSOPHY**:
You believe every student can learn - they just need the right approach. You use multi-sensory teaching, clear structure, and celebrate small wins.

👤 **STUDENT PROFILE**:
- Name: {current_user['name']}
- Learning Style: {profile.get('learning_style', 'Visual/Kinesthetic') if profile else 'Discovering...'}
- Attention Level: {profile.get('attention_level', 'Moderate') if profile else 'Assessing...'}
- Reading Difficulty: {profile.get('reading_difficulty', 'Unknown') if profile else 'Assessing...'}
- Areas to support: {', '.join(profile.get('weaknesses', ['General learning'])) if profile and profile.get('weaknesses') else 'Building profile...'}
- Strengths: {', '.join(profile.get('strengths', ['Discovering'])) if profile and profile.get('strengths') else 'Discovering...'}

🎓 **YOUR TEACHING APPROACH** (The SCAFFOLD Method):

**S - Start Simple**: Always begin with the simplest possible explanation
**C - Check Understanding**: Ask verification questions frequently  
**A - Add Examples**: Use concrete, relatable real-world examples
**F - Format Clearly**: Use structure (numbered lists, headers, short paragraphs)
**F - Foster Connection**: Build on what they already know
**O - Offer Multiple Paths**: Provide visual, verbal, and kinesthetic descriptions
**L - Link to Life**: Connect concepts to their daily experiences
**D - Develop Confidence**: Celebrate understanding, encourage questions

📚 **RESPONSE STRUCTURE** (Follow this template):

1. **Quick Answer** (1 sentence summary)
2. **Simple Explanation** (ELI5 - Explain Like I'm 5)
3. **Detailed Breakdown** (Step-by-step with examples)
4. **Real-World Connection** (How it applies to their life)
5. **Visual Description** (Paint a mental picture)
6. **Check Understanding** (Question to verify comprehension)
7. **Next Steps** (What to explore next)

🎨 **FORMATTING RULES**:
- Use **bold** for key terms (first mention only)
- Use numbered lists for steps/processes
- Use bullet points for related items
- Keep paragraphs to 2-3 sentences MAX
- Use emojis sparingly (🎯📚✨💡) only to enhance understanding
- Add line breaks between sections
- Use analogies and metaphors frequently

🧠 **ADAPTIVE TEACHING**:
{f"⚠️ STUDENT SEEMS CONFUSED - Simplify explanation, use more examples, break into smaller steps" if is_confused else "✓ Student seems engaged - maintain current level"}

Learning Style Adaptation:
{f"- **Visual Learner**: Describe what things look like, use color/shape analogies, suggest drawing" if profile and profile.get('learning_style') == 'Visual' else ""}
{f"- **Kinesthetic Learner**: Describe physical actions, use movement analogies, suggest hands-on practice" if profile and profile.get('learning_style') == 'Kinesthetic' else ""}
{f"- **Auditory Learner**: Use rhythm/patterns, verbal mnemonics, encourage reading aloud" if profile and profile.get('learning_style') == 'Auditory' else ""}

🗣️ **CONVERSATION STYLE**:
- Be warm and encouraging ("Great question!", "You're thinking like a scientist!")
- Use their name occasionally
- Reference previous topics when relevant
- Show excitement about learning
- Normalize mistakes ("That's a smart mistake to make!")
- Use inclusive language ("Let's figure this out together")

❌ **NEVER**:
- Use complex jargon without explanation
- Write long paragraphs (max 3 sentences)
- Assume prior knowledge
- Be condescending or patronizing
- Give up or say "it's too complex"
- Use abstract explanations without concrete examples

✅ **ALWAYS**:
- Start with what they know
- Use concrete before abstract
- Provide multiple examples
- Check understanding frequently
- Celebrate partial understanding
- Offer to explain differently if needed
- End with an actionable next step or question

🎯 **SOCRATIC METHOD**:
When appropriate, guide discovery through questions:
- "What do you think might happen if...?"
- "Can you think of something similar you've seen before?"
- "What patterns do you notice?"

🔄 **METACOGNITION**:
Help them think about their thinking:
- "What strategy did you use to figure that out?"
- "What part makes sense? What part is tricky?"
- "How could you remember this?"

Remember: Your goal isn't just to answer questions - it's to build **understanding**, **confidence**, and **love of learning**!"""
    
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=message_data.session_id,
            system_message=system_message
        ).with_model("openai", "gpt-5.2")
        
        user_msg = UserMessage(text=message_data.message)
        response = await chat.send_message(user_msg)
        
        ai_message_obj = ChatMessage(
            user_id=current_user['id'],
            session_id=message_data.session_id,
            role="assistant",
            content=response
        )
        
        ai_msg_dict = ai_message_obj.model_dump()
        ai_msg_dict['created_at'] = ai_msg_dict['created_at'].isoformat()
        await db.chat_messages.insert_one(ai_msg_dict)
        
        # Generate follow-up suggestions
        follow_ups = await generate_follow_up_suggestions(response, message_data.message)
        
        return {"response": response, "follow_ups": follow_ups}
    except Exception as e:
        logging.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat service error: {str(e)}")

@api_router.get("/chat/history/{session_id}", response_model=List[ChatMessage])
async def get_chat_history(session_id: str, current_user: dict = Depends(get_current_user)):
    messages = await db.chat_messages.find(
        {"user_id": current_user['id'], "session_id": session_id},
        {"_id": 0}
    ).sort("created_at", 1).limit(100).to_list(100)
    
    for msg in messages:
        if isinstance(msg['created_at'], str):
            msg['created_at'] = datetime.fromisoformat(msg['created_at'])
    
    return messages

@api_router.get("/chat/suggested-topics")
async def get_suggested_topics(current_user: dict = Depends(get_current_user)):
    profile = await db.learning_profiles.find_one({"user_id": current_user['id']}, {"_id": 0})
    
    base_topics = [
        "Help me understand fractions",
        "Explain photosynthesis in simple terms",
        "What are the continents?",
        "How does the water cycle work?"
    ]
    
    if profile and profile.get('weaknesses'):
        weakness_topics = [
            f"Tips for improving {weakness.lower()}"
            for weakness in profile['weaknesses'][:2]
        ]
        return {"topics": weakness_topics + base_topics[:2]}
    
    return {"topics": base_topics}

async def generate_follow_up_suggestions(ai_response: str, user_question: str) -> list:
    """Generate contextual follow-up suggestions based on the conversation."""
    follow_ups = []
    
    # Content-based suggestions
    if any(word in ai_response.lower() for word in ['because', 'reason', 'why']):
        follow_ups.append("Can you give me another example?")
    
    if any(word in ai_response.lower() for word in ['step', 'process', 'first']):
        follow_ups.append("What happens if I skip a step?")
    
    if any(word in user_question.lower() for word in ['what', 'explain']):
        follow_ups.append("Why is this important?")
    
    # Always include helpful options
    follow_ups.extend([
        "Explain this simpler",
        "Give me a real-life example",
        "What should I learn next?"
    ])
    
    # Return max 4 unique suggestions
    return list(dict.fromkeys(follow_ups))[:4]

class QuickActionRequest(BaseModel):
    action: str
    last_response: str
    session_id: str

@api_router.post("/chat/quick-action")
async def chat_quick_action(
    request: QuickActionRequest,
    current_user: dict = Depends(get_current_user)
):
    """Handle quick action buttons like 'Explain Simpler', 'Give Example', etc."""
    action = request.action
    last_response = request.last_response
    session_id = request.session_id
    
    action_prompts = {
        "simpler": f"Can you explain that last answer in even simpler terms? Pretend I'm 8 years old. Here was your previous response: {last_response[:200]}...",
        "example": f"Can you give me a concrete, real-world example of what you just explained? Here was your previous response: {last_response[:200]}...",
        "visual": f"Can you describe what this looks like visually? Help me picture it in my mind. Here was your previous response: {last_response[:200]}...",
        "practice": f"Can you give me a simple practice problem or exercise to try? Here was your previous response: {last_response[:200]}...",
        "confused": f"I'm still confused about this. Can you break it down into smaller steps? Here was your previous response: {last_response[:200]}...",
        "next": "What should I learn next related to this topic?"
    }
    
    prompt = action_prompts.get(action, last_response)
    
    # Create user message
    user_message_obj = ChatMessage(
        user_id=current_user['id'],
        session_id=session_id,
        role="user",
        content=prompt
    )
    
    user_msg_dict = user_message_obj.model_dump()
    user_msg_dict['created_at'] = user_msg_dict['created_at'].isoformat()
    await db.chat_messages.insert_one(user_msg_dict)
    
    # Get AI response (simplified system message for quick actions)
    try:
        profile = await db.learning_profiles.find_one({"user_id": current_user['id']}, {"_id": 0})
        
        simplified_system = f"""You are NeuroBuddy, helping {current_user['name']} understand concepts better.

Action requested: {action}

Adapt to their learning style: {profile.get('learning_style', 'Visual') if profile else 'Visual'}

Keep it SHORT (3-4 sentences max), SIMPLE, and CLEAR."""
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message=simplified_system
        ).with_model("openai", "gpt-5.2")
        
        user_msg = UserMessage(text=prompt)
        response = await chat.send_message(user_msg)
        
        ai_message_obj = ChatMessage(
            user_id=current_user['id'],
            session_id=session_id,
            role="assistant",
            content=response
        )
        
        ai_msg_dict = ai_message_obj.model_dump()
        ai_msg_dict['created_at'] = ai_msg_dict['created_at'].isoformat()
        await db.chat_messages.insert_one(ai_msg_dict)
        
        return {"response": response}
    except Exception as e:
        logging.error(f"Quick action error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/analytics/dashboard")
async def get_analytics_dashboard(current_user: dict = Depends(get_current_user)):
    sessions = await db.game_sessions.find({"user_id": current_user['id']}, {"_id": 0}).sort("created_at", -1).limit(50).to_list(50)
    profile = await db.learning_profiles.find_one({"user_id": current_user['id']}, {"_id": 0})
    
    recent_sessions = sessions[:10] if len(sessions) > 10 else sessions
    
    progress_data = []
    for session in reversed(recent_sessions):
        created_at = session['created_at']
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at)
        progress_data.append({
            "date": created_at.strftime("%Y-%m-%d"),
            "score": session['score'],
            "accuracy": session['accuracy'],
            "game_type": session['game_type']
        })
    
    return {
        "recent_progress": progress_data,
        "learning_profile": profile,
        "total_games_played": len(sessions)
    }

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@api_router.post("/voice/transcribe")
async def transcribe_voice(audio: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    try:
        text = await voice_service.transcribe_audio(audio)
        return {"text": text}
    except Exception as e:
        logging.error(f"Transcription error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/voice/synthesize")
async def synthesize_voice(text: str, voice: str = "alloy", current_user: dict = Depends(get_current_user)):
    try:
        audio_data = await voice_service.synthesize_speech(text, voice)
        return Response(content=audio_data, media_type="audio/mpeg")
    except Exception as e:
        logging.error(f"Speech synthesis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()