from __future__ import annotations

import base64
import io
import re
from datetime import datetime
from typing import Any

from fastapi import UploadFile

from app.config import get_settings
from app.models import Contingency, DocumentExtraction, ExtractedDate, Party
from app.services.openai_client import get_openai_client


DOCUMENT_SYSTEM_PROMPT = """
You are a careful real estate transaction document extraction agent.
Extract only facts visible in the uploaded property document.
Return strict JSON matching the provided schema.
If a value is missing, use null or an empty list.
Flag risky ambiguity in risk_summary.
Do not provide legal advice; summarize operational transaction facts.
"""


class DocumentExtractionService:
    async def extract(self, upload: UploadFile) -> DocumentExtraction:
        raw = await upload.read()
        content_type = upload.content_type or "application/octet-stream"
        text = ""
        images: list[str] = []

        if upload.filename and upload.filename.lower().endswith(".pdf"):
            text = self._extract_pdf_text(raw)
            images = self._render_pdf_pages(raw, max_pages=2)
        elif content_type.startswith("image/"):
            images = [base64.b64encode(raw).decode("utf-8")]
        else:
            text = raw.decode("utf-8", errors="ignore")

        client = get_openai_client()
        settings = get_settings()
        if client:
            content: list[dict[str, Any]] = [
                {"type": "text", "text": f"Filename: {upload.filename}\nExtract transaction details. Text layer:\n{text[:12000]}"}
            ]
            for img in images:
                content.append({"type": "image_url", "image_url": {"url": f"data:image/png;base64,{img}"}})
            completion = await client.beta.chat.completions.parse(
                model=settings.openai_vision_model,
                messages=[
                    {"role": "system", "content": DOCUMENT_SYSTEM_PROMPT},
                    {"role": "user", "content": content},
                ],
                response_format=DocumentExtraction,
            )
            parsed = completion.choices[0].message.parsed
            if parsed:
                parsed.calendar_events = self._calendar_events(parsed)
                return parsed

        fallback = self._regex_fallback(text, upload.filename or "document")
        fallback.calendar_events = self._calendar_events(fallback)
        return fallback

    @staticmethod
    def _extract_pdf_text(raw: bytes) -> str:
        try:
            from pypdf import PdfReader

            reader = PdfReader(io.BytesIO(raw))
            return "\n".join(page.extract_text() or "" for page in reader.pages[:10])
        except Exception:
            return ""

    @staticmethod
    def _render_pdf_pages(raw: bytes, max_pages: int = 2) -> list[str]:
        try:
            import fitz  # PyMuPDF

            doc = fitz.open(stream=raw, filetype="pdf")
            out = []
            for page in doc[:max_pages]:
                pix = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False)
                out.append(base64.b64encode(pix.tobytes("png")).decode("utf-8"))
            return out
        except Exception:
            return []

    def _regex_fallback(self, text: str, filename: str) -> DocumentExtraction:
        lower = text.lower()
        doc_type = "purchase_agreement" if "purchase" in lower or "buyer" in lower else "inspection_report"
        money = self._find_money(text)
        dates = [ExtractedDate(label="detected_date", date=d, confidence=0.55) for d in self._find_dates(text)]
        contingencies = []
        for key in ["inspection", "financing", "appraisal", "title", "possession"]:
            if key in lower:
                contingencies.append(
                    Contingency(type=key, summary=f"Document references {key} contingency or milestone.", confidence=0.55)
                )
        parties = []
        for role in ["buyer", "seller", "broker", "agent"]:
            if role in lower:
                parties.append(Party(role=role))
        return DocumentExtraction(
            document_type=doc_type,
            property_address=self._find_address(text),
            parties=parties,
            dates=dates,
            contingencies=contingencies,
            purchase_price=money,
            risk_summary=(
                "Fallback extraction used because OpenAI vision is not configured. "
                "Review the document manually before syncing legal milestones."
            ),
        )

    @staticmethod
    def _find_money(text: str) -> float | None:
        match = re.search(r"(?:₹|INR|Rs\.?|USD|\$)\s*([0-9][0-9,]*(?:\.[0-9]+)?)", text, re.I)
        return float(match.group(1).replace(",", "")) if match else None

    @staticmethod
    def _find_dates(text: str) -> list[str]:
        patterns = [
            r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b",
            r"\b\d{4}-\d{2}-\d{2}\b",
            r"\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b",
        ]
        dates: list[str] = []
        for pattern in patterns:
            dates.extend(re.findall(pattern, text, flags=re.I))
        return dates[:8]

    @staticmethod
    def _find_address(text: str) -> str | None:
        for line in text.splitlines():
            if any(token in line.lower() for token in ["address", "property located", "premises"]):
                return line.strip()[:300]
        return None

    @staticmethod
    def _calendar_events(extraction: DocumentExtraction) -> list[dict[str, Any]]:
        events = []
        for d in extraction.dates:
            events.append(
                {
                    "title": f"Real estate milestone: {d.label}",
                    "date": d.date,
                    "source": extraction.document_type,
                    "confidence": d.confidence,
                }
            )
        for c in extraction.contingencies:
            if c.deadline:
                events.append(
                    {
                        "title": f"Contingency deadline: {c.type}",
                        "date": c.deadline,
                        "source": extraction.document_type,
                        "confidence": c.confidence,
                    }
                )
        return events
