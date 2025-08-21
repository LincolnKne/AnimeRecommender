import os
from typing import List, Dict, Any
import psycopg
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool
from rapidfuzz import fuzz
from dotenv import load_dotenv
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
EMBED_DIM = int(os.getenv("EMBED_DIM", "1536"))

pool = ConnectionPool(conninfo=DATABASE_URL, kwargs={"row_factory": dict_row}, min_size=1, max_size=5)

# Cache last snapshot to avoid repeated DB hits when not needed
_cache: List[Dict[str, Any]] | None = None
_index_by_id: Dict[int, Dict[str, Any]] | None = None

def _normalize_titles_inplace(rows: List[Dict[str, Any]]) -> None:
    for a in rows:
        title = (a.get("title") or "").strip()
        if not title:
            ats = [t.strip() for t in a.get("all_titles", []) if t and t.strip()]
            a["title"] = ats[0] if ats else f"Untitled #{a.get('id','')}"

import os, psycopg, json
from psycopg.rows import dict_row
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

def load_anime_data():
    with psycopg.connect(DATABASE_URL, row_factory=dict_row) as conn:
        rows = conn.execute("""
            SELECT id, title, all_titles, main_picture, tags, synopsis,
                   rating, is_nsfw, total_episodes, children_ids, last_updated
            FROM anime
        """).fetchall()

    data = []
    for row in rows:
        def ensure_list(val):
            if not val:
                return []
            if isinstance(val, str):
                try:
                    return json.loads(val)
                except Exception:
                    return [val]
            return list(val)

        def ensure_dict(val):
            if not val:
                return None
            if isinstance(val, str):
                try:
                    return json.loads(val)
                except Exception:
                    return None
            return val

        data.append({
            "id": row["id"],
            "title": row.get("title"),
            "all_titles": ensure_list(row.get("all_titles")),
            "main_picture": ensure_dict(row.get("main_picture")),
            "tags": ensure_list(row.get("tags")),
            "synopsis": row.get("synopsis"),
            "rating": row.get("rating"),
            "is_nsfw": bool(row.get("is_nsfw", False)),
            "total_episodes": int(row.get("total_episodes") or 0),
            "children_ids": ensure_list(row.get("children_ids")),
            "last_updated": row.get("last_updated"),
        })
    return data

def get_by_ids(ids: List[int]) -> List[Dict[str, Any]]:
    if not ids:
        return []
    with pool.connection() as conn, conn.cursor() as cur:
        cur.execute("""
            SELECT id, title, all_titles, main_picture, tags, synopsis, rating,
                   is_nsfw, total_episodes
            FROM anime WHERE id = ANY(%s)
        """, (ids,))
        rows = cur.fetchall()
        return rows

def get_by_titles(titles: List[str], threshold: int = 80) -> List[int]:
    # Fuzzy-match titles in DB.
    # Exact match first, then fuzzy.
    if not titles:
        return []

    # Use in-memory cache for fuzziness
    data = load_anime_data()
    matched_ids = []

    for title_to_match in titles:
        if not title_to_match or not isinstance(title_to_match, str):
            continue
        t_norm = title_to_match.strip().lower()

        for anime in data:
            all_titles = []
            if anime.get("title"):
                all_titles.append(anime["title"])
            all_titles.extend(anime.get("all_titles", []))
            all_titles_lower = [alt.strip().lower() for alt in all_titles if alt]

            # exact match
            if t_norm in all_titles_lower:
                matched_ids.append(anime["id"])
                continue

            # fuzzy match
            for alt in all_titles_lower:
                if fuzz.ratio(t_norm, alt) >= threshold:
                    matched_ids.append(anime["id"])
                    break

    return list(set(matched_ids))
