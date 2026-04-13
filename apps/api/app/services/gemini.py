from __future__ import annotations

import json
import re
from typing import Any

from fastapi import HTTPException

from app.settings import settings

'''
This module contains functions for interacting with the Gemini AI service for the AI pipelines.
Speech to text and image to text functions are implemented here, as well as the prompt engineering for 
converting to EstimateDraftInput JSON.
'''

try:
    from google import genai
except Exception:  # pragma: no cover
    genai = None


TRANSCRIPTION_PROMPT = (
    "Transcribe this HVAC technician audio note. Return only the transcript text with no commentary."
)

DRAFT_FROM_TEXT_PROMPT = (
    "Convert the following technician note into JSON for EstimateDraftInput. "
    "Return JSON only. If unknown, set null/empty arrays. "
    "Schema: {jobId?, customerId?, labor?:{jobType?, level?, hoursChosen?}, "
    "equipmentLines?:[{equipmentId? , freeText?, qty}], adjustments?:[{code}], "
    "specialNotes?, missingRequiredFields: string[] }."
)

DRAFT_FROM_IMAGE_PROMPT = (
    "Read this handwritten HVAC job note image and convert to EstimateDraftInput JSON. "
    "Return JSON only. If unknown, set null/empty arrays. "
    "Schema: {jobId?, customerId?, labor?:{jobType?, level?, hoursChosen?}, "
    "equipmentLines?:[{equipmentId? , freeText?, qty}], adjustments?:[{code}], "
    "specialNotes?, missingRequiredFields: string[] }."
)


class GeminiService:
    def __init__(self) -> None:
        if not settings.gemini_api_key:
            raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured")
        if genai is None:
            raise HTTPException(status_code=500, detail="google-genai package is not available")

        self.client = genai.Client(api_key=settings.gemini_api_key)
        self.model = settings.gemini_model

    def transcribe_audio(self, data: bytes, mime_type: str) -> str:
        response = self.client.models.generate_content(
            model=self.model,
            contents=[
                TRANSCRIPTION_PROMPT,
                genai.types.Part.from_bytes(data=data, mime_type=mime_type),
            ],
        )
        return (response.text or "").strip()

    def draft_from_text(self, text: str) -> dict[str, Any]:
        response = self.client.models.generate_content(
            model=self.model,
            contents=f"{DRAFT_FROM_TEXT_PROMPT}\n\nTECH NOTE:\n{text}",
        )
        return _extract_json(response.text or "{}")

    def draft_from_image(self, data: bytes, mime_type: str) -> tuple[dict[str, Any], str]:
        response = self.client.models.generate_content(
            model=self.model,
            contents=[
                DRAFT_FROM_IMAGE_PROMPT,
                genai.types.Part.from_bytes(data=data, mime_type=mime_type),
            ],
        )
        text = response.text or ""
        return _extract_json(text), text


def _extract_json(text: str) -> dict[str, Any]:
    cleaned = text.strip()
    if not cleaned:
        return {}

    fence = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", cleaned, flags=re.DOTALL)
    if fence:
        cleaned = fence.group(1)

    try:
        payload = json.loads(cleaned)
    except json.JSONDecodeError:
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start == -1 or end == -1 or end <= start:
            return {}
        try:
            payload = json.loads(cleaned[start : end + 1])
        except json.JSONDecodeError:
            return {}

    if not isinstance(payload, dict):
        return {}

    return payload
