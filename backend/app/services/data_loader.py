import json
from pathlib import Path
from typing import List, Dict, Any

DATA_PATH = Path(__file__).resolve().parents[1] / "data" / "anime_data.json"

_cache: List[Dict[str, Any]] | None = None
_index_by_id: Dict[int, Dict[str, Any]] | None = None

def load_anime_data() -> List[Dict[str, Any]]:
    # Load anime data from file, cache for future use
    global _cache, _index_by_id
    if _cache is None:
        with open(DATA_PATH, "r", encoding="utf-8") as f:
            _cache = json.load(f)
        _index_by_id = {int(a["id"]): a for a in _cache}
    return _cache

def get_by_ids(ids: List[int]) -> List[Dict[str, Any]]:
    # Get anime entries by their IDs
    load_anime_data()
    return [_index_by_id[i] for i in ids if i in _index_by_id]  # type: ignore
