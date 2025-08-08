from fastapi import APIRouter, Query
from typing import List
from ..services.data_loader import load_anime_data

router = APIRouter()

@router.get("/search")
def search(q: str = Query(""), limit: int = 10) -> List[dict]:
    q_lower = q.strip().lower()
    if not q_lower:
        return []

    data = load_anime_data()

    prefix_matches = []
    substring_matches = []

    for anime in data:
        title = (anime.get("title") or "").lower()
        if title.startswith(q_lower):
            prefix_matches.append(anime)
        elif q_lower in title:
            substring_matches.append(anime)

    # Merge results with prefix matches first
    results = prefix_matches + substring_matches

    # Prepare minimal response
    formatted_results = [
        {
            "id": a["id"],
            "title": a.get("title"),
            "main_picture": a.get("main_picture"),
            "synopsis": a.get("synopsis"),
            "total_episodes": a.get("total_episodes")
        }
        for a in results
    ]

    return formatted_results[:limit]
