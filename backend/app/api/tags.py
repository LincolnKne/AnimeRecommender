from fastapi import APIRouter, Query
import time, os, psycopg
from psycopg.rows import dict_row
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

router = APIRouter()

NSFW_TAGS = {
    "hentai",
    "ecchi",
    "magical sex shift",
    "erotica"
}

# Cache
_tags_cache = {
    "nsfw_false": None,
    "nsfw_true": None,
    "last_updated": 0
}
CACHE_TTL = 60  # seconds

def _build_tags(nsfw_ok: bool):
    tags_map = {}

    with psycopg.connect(DATABASE_URL, row_factory=dict_row) as conn:
        rows = conn.execute("SELECT tags FROM anime").fetchall()

    for row in rows:
        for tag in row["tags"] or []:
            tag_clean = tag.strip()
            tag_lower = tag_clean.lower()

            if not nsfw_ok and tag_lower in NSFW_TAGS:
                continue

            if tag_lower not in tags_map:
                tags_map[tag_lower] = tag_clean

    return sorted(tags_map.values(), key=lambda t: t.lower())


@router.get("/tags")
def get_tags(nsfw_ok: bool = Query(False, description="Include NSFW tags")):
    cache_key = "nsfw_true" if nsfw_ok else "nsfw_false"
    now = time.time()

    if (
        _tags_cache[cache_key] is None
        or now - _tags_cache["last_updated"] > CACHE_TTL
    ):
        _tags_cache[cache_key] = {"tags": _build_tags(nsfw_ok)}
        _tags_cache["last_updated"] = now

    return _tags_cache[cache_key]
