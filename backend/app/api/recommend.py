from fastapi import APIRouter, HTTPException
from ..models.schemas import RecommendRequest, ScoredAnime, Anime, RecommendReason
from ..services.data_loader import load_anime_data, get_by_ids
from ..recommender.hybrid_recommender import score_candidates

router = APIRouter()

@router.post("/recommend", response_model=list[ScoredAnime])
def recommend(req: RecommendRequest):
    # Shared logic (also used for /recommend/more)
    return _generate_recommendations(req)

@router.post("/recommend/more", response_model=list[ScoredAnime])
def recommend_more(req: RecommendRequest):
    # Same logic — rely on exclude_ids to avoid repeats
    return _generate_recommendations(req)

def _generate_recommendations(req: RecommendRequest):
    all_anime = load_anime_data()
    all_ids = {a["id"] for a in all_anime}

    # Validate liked/disliked IDs
    invalid_ids = [i for i in req.liked_ids + req.disliked_ids if i not in all_ids]
    if invalid_ids:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid anime IDs: {invalid_ids}"
        )

    exclude_ids = set(req.liked_ids) | set(req.disliked_ids) | set(req.exclude_ids)
    candidates = [a for a in all_anime if a["id"] not in exclude_ids]

    liked = get_by_ids(req.liked_ids)
    disliked = get_by_ids(req.disliked_ids)

    scored = score_candidates(
        all_items=candidates,
        liked=liked,
        disliked=disliked,
        moods=req.moods,
        nsfw_ok=req.nsfw_ok
    )

    response: list[ScoredAnime] = []
    for anime, score, overlap in scored[:req.limit]:
        response.append(
            ScoredAnime(
                anime=Anime(**{k: anime.get(k) for k in [
                    "id", "title", "main_picture", "tags", "synopsis",
                    "rating", "is_nsfw", "total_episodes"
                ]}),
                score=round(float(score), 4),
                reason=RecommendReason(
                    overlap_tags=overlap,
                    note="Matched using hybrid tag + synopsis similarity."
                )
            )
        )
    return response
from fastapi import APIRouter, HTTPException
from time import time
import json
from ..models.schemas import RecommendRequest, ScoredAnime, Anime, RecommendReason
from ..services.data_loader import load_anime_data, get_by_ids
from ..recommender.hybrid_recommender import score_candidates

router = APIRouter()

# Cache storage: { cache_key: (timestamp, results) }
_recommend_cache = {}
CACHE_TTL = 60  # seconds

@router.post("/recommend", response_model=list[ScoredAnime])
def recommend(req: RecommendRequest):
    return _generate_recommendations(req, endpoint="recommend")

@router.post("/recommend/more", response_model=list[ScoredAnime])
def recommend_more(req: RecommendRequest):
    return _generate_recommendations(req, endpoint="recommend_more")

def _generate_recommendations(req: RecommendRequest, endpoint: str):
    # Build a unique cache key from endpoint + request body
    cache_key = f"{endpoint}:{json.dumps(req.dict(), sort_keys=True)}"
    now = time()

    # Return cached result if not expired
    if cache_key in _recommend_cache:
        ts, cached_result = _recommend_cache[cache_key]
        if now - ts < CACHE_TTL:
            return cached_result

    all_anime = load_anime_data()
    all_ids = {a["id"] for a in all_anime}

    # Validate IDs
    invalid_ids = [i for i in req.liked_ids + req.disliked_ids if i not in all_ids]
    if invalid_ids:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid anime IDs: {invalid_ids}"
        )

    exclude_ids = set(req.liked_ids) | set(req.disliked_ids) | set(req.exclude_ids)
    candidates = [a for a in all_anime if a["id"] not in exclude_ids]

    liked = get_by_ids(req.liked_ids)
    disliked = get_by_ids(req.disliked_ids)

    scored = score_candidates(
        all_items=candidates,
        liked=liked,
        disliked=disliked,
        moods=req.moods,
        nsfw_ok=req.nsfw_ok
    )

    response: list[ScoredAnime] = []
    for anime, score, overlap in scored[:req.limit]:
        response.append(
            ScoredAnime(
                anime=Anime(**{k: anime.get(k) for k in [
                    "id", "title", "main_picture", "tags", "synopsis",
                    "rating", "is_nsfw", "total_episodes"
                ]}),
                score=round(float(score), 4),
                reason=RecommendReason(
                    overlap_tags=overlap,
                    note="Matched using hybrid tag + synopsis similarity."
                )
            )
        )

    # Store in cache
    _recommend_cache[cache_key] = (now, response)
    return response
