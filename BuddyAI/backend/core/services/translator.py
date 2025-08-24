import os
import re
import time
from typing import Optional, Tuple, Dict, Any

import requests

try:
    from langchain_openai import ChatOpenAI
    from langchain.schema import HumanMessage
except Exception:  # pragma: no cover
    ChatOpenAI = None  # type: ignore
    HumanMessage = None  # type: ignore


AR_REGEX = re.compile(r"[\u0600-\u06FF]")


def is_arabic_text(text: str) -> bool:
    if not text:
        return False
    return bool(AR_REGEX.search(text))


class TranslatorError(Exception):
    pass


class TranslatorProviderBase:
    def translate(self, text: str, source_lang: Optional[str], target_lang: str, timeout: float = 12.0) -> Tuple[str, str]:
        """
        Translate text. Returns (translated_text, detected_source_lang).
        Should raise TranslatorError on failure.
        """
        raise NotImplementedError

    def is_configured(self) -> bool:
        return False


class LibreTranslator(TranslatorProviderBase):
    def __init__(self, endpoint: Optional[str], api_key: Optional[str]):
        # Default public instance; better to self-host for production.
        self.endpoint = (endpoint or "https://libretranslate.com").rstrip("/")
        self.api_key = api_key

    def is_configured(self) -> bool:
        return True  # Libre can work without API key on some instances

    def translate(self, text: str, source_lang: Optional[str], target_lang: str, timeout: float = 12.0) -> Tuple[str, str]:
        url = f"{self.endpoint}/translate"
        payload: Dict[str, Any] = {
            "q": text,
            "target": target_lang,
            "format": "text",
        }
        if source_lang:
            payload["source"] = source_lang
        if self.api_key:
            payload["api_key"] = self.api_key

        try:
            resp = requests.post(url, json=payload, timeout=timeout)
            if resp.status_code != 200:
                raise TranslatorError(f"LibreTranslate HTTP {resp.status_code}: {resp.text[:200]}")
            data = resp.json()
            translated = data.get("translatedText", "")

            # Detect source language if not provided
            detected = source_lang or ("ar" if is_arabic_text(text) else "en")
            return translated, detected
        except requests.Timeout:
            raise TranslatorError("Translation request timed out")
        except Exception as e:
            raise TranslatorError(str(e))


class GoogleV2Translator(TranslatorProviderBase):
    def __init__(self, api_key: Optional[str]):
        self.api_key = api_key

    def is_configured(self) -> bool:
        return bool(self.api_key)

    def translate(self, text: str, source_lang: Optional[str], target_lang: str, timeout: float = 12.0) -> Tuple[str, str]:
        if not self.api_key:
            raise TranslatorError("Google Translate API key not configured")
        url = "https://translation.googleapis.com/language/translate/v2"
        params = {"key": self.api_key}
        payload: Dict[str, Any] = {"q": text, "target": target_lang}
        if source_lang:
            payload["source"] = source_lang
        try:
            resp = requests.post(url, params=params, json=payload, timeout=timeout)
            if resp.status_code != 200:
                raise TranslatorError(f"Google HTTP {resp.status_code}: {resp.text[:200]}")
            data = resp.json()
            translations = data.get("data", {}).get("translations", [])
            if not translations:
                raise TranslatorError("Empty translation result")
            item = translations[0]
            translated = item.get("translatedText", "")
            detected = item.get("detectedSourceLanguage") or source_lang or ("ar" if is_arabic_text(text) else "en")
            return translated, detected
        except requests.Timeout:
            raise TranslatorError("Translation request timed out")
        except Exception as e:
            raise TranslatorError(str(e))


class AzureTranslator(TranslatorProviderBase):
    def __init__(self, endpoint: Optional[str], api_key: Optional[str], region: Optional[str]):
        self.endpoint = (endpoint or "").rstrip("/")
        self.api_key = api_key
        self.region = region

    def is_configured(self) -> bool:
        return bool(self.endpoint and self.api_key)

    def translate(self, text: str, source_lang: Optional[str], target_lang: str, timeout: float = 6.0) -> Tuple[str, str]:
        if not self.is_configured():
            raise TranslatorError("Azure Translator not configured")
        url = f"{self.endpoint}/translate"
        params = {"api-version": "3.0", "to": target_lang}
        if source_lang:
            params["from"] = source_lang
        headers = {
            "Ocp-Apim-Subscription-Key": self.api_key,  # type: ignore[arg-type]
            "Content-Type": "application/json",
        }
        if self.region:
            headers["Ocp-Apim-Subscription-Region"] = self.region
        body = [{"text": text}]
        try:
            resp = requests.post(url, params=params, headers=headers, json=body, timeout=timeout)
            if resp.status_code != 200:
                raise TranslatorError(f"Azure HTTP {resp.status_code}: {resp.text[:200]}")
            data = resp.json()
            translations = data[0].get("translations", []) if data else []
            if not translations:
                raise TranslatorError("Empty translation result")
            translated = translations[0].get("text", "")
            detected = data[0].get("detectedLanguage", {}).get("language") or source_lang or ("ar" if is_arabic_text(text) else "en")
            return translated, detected
        except requests.Timeout:
            raise TranslatorError("Translation request timed out")
        except Exception as e:
            raise TranslatorError(str(e))


class LLMTranslator(TranslatorProviderBase):
    """Use an LLM (e.g., DeepSeek via OpenAI-compatible API) to translate with a strict prompt."""

    def __init__(self, api_key: Optional[str], base_url: Optional[str], model: Optional[str]):
        self.api_key = api_key
        self.base_url = base_url
        self.model = model or os.getenv("LLM_TRANSLATOR_MODEL") or os.getenv("LLM_MODEL") or "deepseek-chat"
        self._llm = None

    def is_configured(self) -> bool:
        print(f"🔍 LLM Translator Configuration Check:")
        print(f"API Key Present: {bool(self.api_key)}")
        print(f"ChatOpenAI Available: {ChatOpenAI is not None}")
        print(f"Base URL: {self.base_url}")
        print(f"Model: {self.model}")
        return bool(self.api_key) and ChatOpenAI is not None

    def _get_client(self):
        if self._llm is None:
            # Use very low temperature to keep deterministic translations
            kwargs: Dict[str, Any] = {
                "temperature": 0.0,
                "model": self.model,
                "openai_api_key": self.api_key,
            }
            if self.base_url:
                kwargs["base_url"] = self.base_url
            self._llm = ChatOpenAI(**kwargs)  # type: ignore[call-arg]
        return self._llm

    def translate(self, text: str, source_lang: Optional[str], target_lang: str, timeout: float = 6.0) -> Tuple[str, str]:
        if not self.is_configured():
            raise TranslatorError("LLM translator not configured")
        detected = source_lang or ("ar" if is_arabic_text(text) else "en")
        prompt = (
            f"You are a professional translator. Translate the following text from {detected.upper()} to {target_lang.upper()} "
            f"accurately and naturally. Preserve meaning and tone. Output ONLY the translated text with no explanations.\n\n"
            f"Text:\n{text}"
        )
        try:
            llm = self._get_client()
            # Use timeout via requests adapter is not trivial here; rely on gateway timeout limits
            result = llm.invoke([HumanMessage(content=prompt)])  # type: ignore[misc]
            translated = (getattr(result, "content", None) or "").strip()
            if not translated:
                raise TranslatorError("Empty translation result")
            return translated, detected
        except Exception as e:
            raise TranslatorError(str(e))


def get_translator() -> TranslatorProviderBase:
    provider = (os.getenv("TRANSLATOR_PROVIDER") or "").strip().lower()
    api_key = os.getenv("TRANSLATOR_API_KEY")
    endpoint = os.getenv("TRANSLATOR_ENDPOINT")
    region = os.getenv("TRANSLATOR_REGION")
    # LLM translator (DeepSeek via OpenAI-compatible API)
    llm_api_key = os.getenv("LLM_TRANSLATOR_API_KEY") or os.getenv("OPENAI_API_KEY")
    llm_base_url = os.getenv("LLM_TRANSLATOR_API_BASE") or os.getenv("OPENAI_BASE_URL")

    # Explicit providers first
    if provider == "google":
        return GoogleV2Translator(api_key)
    if provider == "azure":
        return AzureTranslator(endpoint, api_key, region)
    if provider == "deepl":
        # Simple passthrough to Libre-like behavior is not correct for DeepL; leave unconfigured
        return LibreTranslator(endpoint, api_key)  # placeholder if someone points endpoint to a proxy
    if provider == "libre":
        return LibreTranslator(endpoint, api_key)
    if provider in ("llm", "deepseek"):
        return LLMTranslator(api_key=llm_api_key, base_url=llm_base_url, model=os.getenv("LLM_TRANSLATOR_MODEL"))

    # Fallback: if LLM creds are present, use LLM translator even without provider set
    if llm_api_key and (llm_base_url or True):  # base_url optional for some gateways
        return LLMTranslator(api_key=llm_api_key, base_url=llm_base_url, model=os.getenv("LLM_TRANSLATOR_MODEL"))

    # No provider configured
    return NoOpTranslator()


class NoOpTranslator(TranslatorProviderBase):
    def is_configured(self) -> bool:
        return False

    def translate(self, text: str, source_lang: Optional[str], target_lang: str, timeout: float = 6.0) -> Tuple[str, str]:
        raise TranslatorError("Translation disabled: no provider configured")


# Simple in-process rate limiter
class RateLimiter:
    def __init__(self, max_per_minute: int = 30):
        self.max_per_minute = max_per_minute
        self.window_start = 0.0
        self.count = 0

    def allow(self) -> bool:
        now = time.time()
        if now - self.window_start >= 60.0:
            self.window_start = now
            self.count = 0
        if self.count < self.max_per_minute:
            self.count += 1
            return True
        return False


rate_limiter = RateLimiter()


# -------- Helpers for long text handling and simple caching ---------
def split_text_into_chunks(text: str, max_chars: int = 1200) -> list[str]:
    """Split text into chunks close to max_chars, preferably at paragraph/sentence boundaries."""
    text = text.strip()
    if len(text) <= max_chars:
        return [text]

    paragraphs = [p.strip() for p in text.split("\n")]
    chunks: list[str] = []
    current: list[str] = []
    current_len = 0

    def flush():
        nonlocal current, current_len
        if current:
            chunks.append("\n".join(current).strip())
            current = []
            current_len = 0

    for p in paragraphs:
        if not p:
            # Preserve paragraph separators without growing chunks too fast
            if current_len + 1 > max_chars:
                flush()
            current.append("")
            current_len += 1
            continue
        if len(p) > max_chars:
            # Break long paragraph by sentences
            sentences = re.split(r"(?<=[.!?])\s+", p)
            buf: list[str] = []
            buf_len = 0
            for s in sentences:
                if buf_len + len(s) + 1 > max_chars:
                    if buf:
                        if current_len + buf_len + 1 > max_chars:
                            flush()
                        current.append(" ".join(buf))
                        current_len += buf_len + 1
                        buf = []
                        buf_len = 0
                buf.append(s)
                buf_len += len(s) + 1
            if buf:
                if current_len + buf_len + 1 > max_chars:
                    flush()
                current.append(" ".join(buf))
                current_len += buf_len + 1
        else:
            if current_len + len(p) + 1 > max_chars:
                flush()
            current.append(p)
            current_len += len(p) + 1
    flush()
    return [c for c in chunks if c]


from collections import OrderedDict


class _LRUCache(OrderedDict):
    def __init__(self, capacity: int = 64):
        super().__init__()
        self.capacity = capacity

    def get(self, key):  # type: ignore[override]
        if key not in self:
            return None
        value = super().pop(key)
        super().__setitem__(key, value)
        return value

    def set(self, key, value):
        if key in self:
            super().pop(key)
        elif len(self) >= self.capacity:
            self.popitem(last=False)
        super().__setitem__(key, value)


translation_cache = _LRUCache(capacity=64)


