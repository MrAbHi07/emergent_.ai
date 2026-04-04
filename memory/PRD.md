# NeuroBuddy AI – Product Requirements Document

## Overview
NeuroBuddy AI is an intelligent companion platform for neurodiverse students (Autism, ADHD, Dyslexia), featuring gamified cognitive assessments, AI-based learning assistance, and personalized learning experiences.

## Tech Stack
- **Frontend**: React.js, Tailwind CSS, Shadcn/UI, Web Speech API
- **Backend**: FastAPI (Python), MongoDB (Motor)
- **AI/ML**: Scikit-learn (Random Forest), OpenAI GPT-5.2 via `emergentintegrations` (Emergent LLM Key)

## Design System (Dark Premium SaaS)
- **Theme**: Dark (#05050A background, #0F111A surface)
- **Primary**: Emerald #34D399 (glow: rgba(52,211,153,0.4))
- **Secondary**: Amber #FBBF24 (glow: rgba(251,191,36,0.4))
- **Accent**: Blue #38BDF8 (glow: rgba(56,189,248,0.4))
- **Text**: #F8FAFC primary, #94A3B8 secondary, #64748B muted
- **Fonts**: Outfit (headings), Manrope (body)
- **Surfaces**: Crystal Glassmorphism (bg-white/4, backdrop-blur-20px, border-white/8)
- **Effects**: Gradient orbs, glow shadows, hover lifts, staggered animations

## Core Modules

### 1. Authentication (JWT)
- Login/Register with email & password, glassmorphic dark cards
- Role-based: Student, Parent, Teacher
- JWT token-based auth

### 2. Gamified Cognitive Assessments
- Memory Game, Reaction Time, Pattern Recognition, Reading Assessment
- All with scoring, animations, dark-themed cards

### 3. Machine Learning Module
- Scikit-learn Random Forest, generates learning profiles
- attention_level, learning_style, reading_difficulty

### 4. AI Tutor Chatbot
- GPT-5.2, SCAFFOLD method, Markdown responses
- Quick actions, follow-up suggestions, suggested topics
- Dark-themed chat bubbles with emerald/glass styling

### 5. Voice Interaction
- **STT**: Web Speech API (`voiceTranscription.js`)
- **TTS**: Web Speech API speechSynthesis (`textToSpeech.js`)
  - Voice selection, speed control, pause/resume/stop, loading indicator

### 6. Analytics Dashboard
- Dark charts with emerald/blue lines
- Profile cards, strengths/weaknesses, recommendations

## What's Implemented
- [x] JWT Authentication
- [x] 4 Gamified Cognitive Assessments
- [x] ML Model (Scikit-learn)
- [x] AI Tutor Chatbot (GPT-5.2, Markdown, Quick Actions)
- [x] Analytics Dashboard
- [x] Voice STT + TTS (full controls)
- [x] **Dark Premium SaaS UI** — 2026-04-04

## Backlog
### P0 — Personalized Learning Engine
### P2 — File Cleanup (remove legacy *Old.js files)

## Key API Endpoints
- POST /api/auth/register & /api/auth/login
- POST /api/games/session, GET /api/games/stats
- GET /api/ml/profile/{user_id}
- POST /api/chat/send, POST /api/chat/quick-action
- GET /api/analytics/dashboard
