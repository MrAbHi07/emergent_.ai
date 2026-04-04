# NeuroBuddy AI – Product Requirements Document

## Overview
NeuroBuddy AI is an intelligent companion platform for neurodiverse students (Autism, ADHD, Dyslexia), featuring gamified cognitive assessments, AI-based learning assistance, and personalized learning experiences.

## Tech Stack
- **Frontend**: React.js, Tailwind CSS, Shadcn/UI, Web Speech API
- **Backend**: FastAPI (Python), MongoDB (Motor)
- **AI/ML**: Scikit-learn (Random Forest), OpenAI GPT-5.2 via `emergentintegrations` (Emergent LLM Key)

## Core Modules

### 1. Authentication (JWT)
- Login/Register with email & password
- Role-based: Student, Parent, Teacher
- JWT token-based auth

### 2. Gamified Cognitive Assessments
- **Memory Game** — Card matching with scoring & animations
- **Reaction Time** — Speed-based response measurement
- **Pattern Recognition** — Visual pattern identification
- **Reading Assessment** — Reading comprehension challenges

### 3. Machine Learning Module
- Scikit-learn Random Forest classifier
- Generates learning profiles: attention_level, learning_style, reading_difficulty
- Trains on game session data

### 4. AI Tutor Chatbot
- GPT-5.2 powered via Emergent LLM Key
- SCAFFOLD method pedagogical prompts
- Markdown-rendered responses
- Quick actions: Explain Simpler, Give Example, Show Visually, Practice Problem, I'm Confused
- Follow-up suggestion chips
- Suggested topics on empty chat

### 5. Voice Interaction
- **STT (Speech-to-Text)**: Web Speech API (frontend, `voiceTranscription.js`)
- **TTS (Text-to-Speech)**: Web Speech API speechSynthesis (frontend, `textToSpeech.js`)
  - Voice loading with async fallback
  - Markdown stripping for natural reading
  - Chrome long-text keep-alive workaround
  - Per-message and global Read Aloud buttons
  - Stop/Play toggle

### 6. Analytics Dashboard
- Game session history and performance trends
- ML-generated learning profile display

## What's Implemented
- [x] JWT Authentication (Login/Register)
- [x] 4 Gamified Cognitive Assessments (Memory, Reaction, Pattern, Reading)
- [x] ML Model (Scikit-learn Random Forest)
- [x] AI Tutor Chatbot (GPT-5.2, Markdown, Quick Actions, Follow-ups)
- [x] Analytics Dashboard
- [x] Voice STT (Web Speech API)
- [x] Voice TTS (Web Speech API speechSynthesis) — Fixed 2026-04-04
- [x] Quick Action endpoint fix (query params → JSON body) — Fixed 2026-04-04

## Backlog

### P0 — Personalized Learning Engine
- Dynamically adjust content difficulty based on ML profile
- Recommend lesson formats (text, audio, visual) per learning style
- New Learning page or Dashboard integration

### P2 — File Cleanup
- Remove legacy files: `AITutorOld.js`, `PatternGameOld.js`, `ReactionGameOld.js`, `ReadingGameOld.js`
- Remove unused `voice_service.py`

## Key API Endpoints
- `POST /api/auth/register` & `POST /api/auth/login`
- `POST /api/games/session` (Log game data)
- `GET /api/ml/profile/{user_id}` (ML profile)
- `POST /api/chat/send` (AI Tutor)
- `POST /api/chat/quick-action` (Quick actions)
- `GET /api/chat/suggested-topics`

## DB Schema
- **users**: email, hashed_password, role, full_name
- **game_sessions**: user_id, game_type, score, accuracy, response_time, timestamp
- **ml_profiles**: user_id, attention_level, learning_style, reading_difficulty, last_updated
- **chat_history**: user_id, messages, timestamp
