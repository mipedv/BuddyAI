from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json

from core.services.translator import (
    get_translator,
    TranslatorError,
    is_arabic_text,
    rate_limiter,
    split_text_into_chunks,
    translation_cache,
)


@csrf_exempt
@require_http_methods(["GET"]) 
def translate_status_view(request):
    """Return whether a translation provider is configured."""
    translator = get_translator()
    return JsonResponse({"success": True, "configured": translator.is_configured()})


@csrf_exempt
@require_http_methods(["POST"])
def translate_view(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"success": False, "error": "Invalid JSON"}, status=400)

    text = (data.get("text") or "").strip()
    source_lang = data.get("sourceLang") or None
    target_lang = data.get("targetLang") or None

    if not text:
        return JsonResponse({"success": False, "error": "'text' is required"}, status=400)
    if target_lang not in ("en", "ar"):
        return JsonResponse({"success": False, "error": "'targetLang' must be 'en' or 'ar'"}, status=400)

    translator = get_translator()
    if not translator.is_configured():
        return JsonResponse({"success": False, "error": "Translation provider not configured"}, status=503)

    if not rate_limiter.allow():
        return JsonResponse({"success": False, "error": "Rate limit exceeded. Please try again later."}, status=429)

    # Best-effort source detection if not provided
    if source_lang not in ("en", "ar"):
        source_lang = "ar" if is_arabic_text(text) else "en"

    try:
        cache_key = f"{source_lang or 'auto'}->{target_lang}:{hash(text)}"
        cached = translation_cache.get(cache_key)
        if cached:
            return JsonResponse({
                "success": True,
                "translatedText": cached["text"],
                "sourceLangDetected": cached["detected"],
                "cached": True,
            })

        # Split long content to reduce model latency/timeouts and return combined result
        parts = split_text_into_chunks(text, max_chars=900)
        translated_parts: list[str] = []
        detected_lang = source_lang or ("ar" if is_arabic_text(text) else "en")

        # Translate chunks concurrently to reduce total latency
        from concurrent.futures import ThreadPoolExecutor, as_completed

        def _do_translate(p: str):
            # Use pre-detected source for all parts
            t, _ = translator.translate(p, detected_lang, target_lang)
            return t

        with ThreadPoolExecutor(max_workers=min(4, len(parts))) as ex:
            futures = [ex.submit(_do_translate, p) for p in parts]
            # Preserve original order by mapping
            results: dict[int, str] = {}
            for idx, fut in enumerate(futures):
                try:
                    results[idx] = fut.result()
                except Exception as _:
                    results[idx] = ""
            translated_parts = [results[i] for i in range(len(parts))]
        combined = "\n\n".join(translated_parts).strip()

        # Cache combined output
        translation_cache.set(cache_key, {"text": combined, "detected": detected_lang})

        return JsonResponse({
            "success": True,
            "translatedText": combined,
            "sourceLangDetected": detected_lang,
            "chunks": len(parts),
        })
    except TranslatorError as e:
        return JsonResponse({"success": False, "error": str(e)}, status=502)
    except Exception as e:
        return JsonResponse({"success": False, "error": f"Unexpected error: {str(e)}"}, status=500)


