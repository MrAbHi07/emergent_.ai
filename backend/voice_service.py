from fastapi import UploadFile, HTTPException
import os
from pathlib import Path
import base64
import io
from emergentintegrations.llm.openai import OpenAISpeechToText, OpenAITextToSpeech

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

class VoiceService:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.stt = OpenAISpeechToText(api_key=api_key)
        self.tts = OpenAITextToSpeech(api_key=api_key)
    
    async def transcribe_audio(self, audio_file: UploadFile) -> str:
        """
        Transcribe audio file to text using OpenAI Whisper.
        
        Args:
            audio_file: Uploaded audio file
        
        Returns:
            str: Transcribed text
        """
        try:
            # Read audio file content
            audio_content = await audio_file.read()
            
            # Save temporarily
            temp_path = Path("/tmp") / f"audio_{audio_file.filename}"
            with open(temp_path, "wb") as f:
                f.write(audio_content)
            
            # Transcribe using emergentintegrations
            with open(temp_path, "rb") as f:
                response = await self.stt.transcribe(
                    file=f,
                    model="whisper-1",
                    response_format="json"
                )
            
            # Clean up
            temp_path.unlink()
            
            return response.text
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
    
    async def synthesize_speech(self, text: str, voice: str = "alloy") -> bytes:
        """
        Convert text to speech using OpenAI TTS.
        
        Args:
            text: Text to convert to speech
            voice: Voice model to use
        
        Returns:
            bytes: Audio data
        """
        try:
            response = await self.tts.generate(
                input_text=text,
                model="tts-1",
                voice=voice,
                response_format="mp3",
                speed=1.0
            )
            
            return response.audio_data
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Speech synthesis failed: {str(e)}")

# Initialize global voice service
voice_service = VoiceService(EMERGENT_LLM_KEY)