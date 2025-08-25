from django.http import JsonResponse, HttpRequest
from django.views.decorators.http import require_GET
from django.views.decorators.csrf import csrf_exempt


@csrf_exempt
@require_GET
def discover(request: HttpRequest):
    """Lightweight stub for curiosity discover feed.

    Query params:
      - subjectId, chapterId, topic, interests, cursor, limit
    Returns a mocked list of items and optional nextCursor.
    """
    limit = int(request.GET.get("limit") or 10)
    # Static mocked items; later can be wired to real aggregator
    items = [
        {
            "id": f"disc-{i}",
            "title": f"NASA Extends Voyager {i} Mission",
            "snippet": "NASA has taken steps to extend the lifespan of the Voyager spacecraft, continuing interstellar exploration...",
            "source": "dailyed",
            "publishedAt": "2025-08-24T12:00:00Z",
            "imageUrl": "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200",
            "url": "https://example.com/article/voyager",
        }
        for i in range(1, limit + 1)
    ]
    return JsonResponse({"items": items})


