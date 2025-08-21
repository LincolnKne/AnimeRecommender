from fastapi import APIRouter
import time
from ..services.db_loader import load_anime_data

router = APIRouter()

_metadata_cache = {
    "data": None,
    "last_updated": 0
}
CACHE_TTL = 60  # seconds

def _build_metadata():
    data = load_anime_data()
    total_entries = len(data)
    last_updated = max(
        (anime.get("last_updated") for anime in data if anime.get("last_updated")),
        default=None
    )
    return {"total_entries": total_entries, "last_updated": last_updated}

@router.get("/metadata")
def get_metadata():
    now = time.time()

    if (
        _metadata_cache["data"] is None
        or now - _metadata_cache["last_updated"] > CACHE_TTL
    ):
        _metadata_cache["data"] = _build_metadata()
        _metadata_cache["last_updated"] = now

    return _metadata_cache["data"]
