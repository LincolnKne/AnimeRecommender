# AnimeRecommender

## Overview
**AnimeRecommender** is an intelligent anime recommendation engine that blends **tag-based filtering**, **user preference weighting**, and **semantic search** using **OpenAI** and **Sentence Transformers** embeddings.  
Our goal is to go beyond “similar title” recommendations by deeply understanding *why* a user likes something — whether it’s the **themes**, the **tone**, or the **relationships** — and tailoring results accordingly.

---

## Core Objectives
- **Give users more control**: Let them mix and match multiple input methods for a single request.  
- **Understand intent, not just tags**: Use NLP to interpret natural language queries and extract meaningful moods and concepts.  
- **Avoid token waste**: Only use OpenAI when necessary (i.e., if a free-text query is provided).  
- **Support multiple title languages**: Match English, Japanese, Chinese, and alternate titles automatically.  
- **Filter out irrelevant content**: NSFW filtering, seasonal filtering, and popularity thresholds keep recommendations relevant.  

---

## How It Works

### 1. Data Collection
- Pull anime metadata from the **MyAnimeList API** using OAuth.
- Fetch rankings, current/previous seasonal anime, and store:
  - Title (English, native, and all alternates)
  - Synopsis
  - Genres and themes (tags)
  - NSFW flags
  - Total episodes
- Store **alternative titles** so searches match regardless of language input.

### 2. Embedding Generation
- Each anime’s synopsis and tags are embedded using the `all-MiniLM-L6-v2` Sentence Transformers model.
- Enables **semantic similarity search** so we can match “feel” even if tags don’t align.

### 3. Recommendation Engine
- Accepts *any combination* of:
  - Filter tags (e.g., `"dark fantasy"`, `"romance"`)
  - Liked/disliked anime IDs
  - Natural language query  
    e.g., `"I liked the gritty feeling and gore from Attack on Titan but also the romance between two adult men from Heaven Official’s Blessing"`
- Uses a **weighted hybrid scoring** approach:
  - **35%** Tag overlap score  
  - **25%** Liked anime similarity  
  - **40%** Semantic query similarity  
- Weights are tweakable to fine-tune the recommendation style.

### 4. OpenAI Parsing
- When a free-text query is present, OpenAI extracts:
  - Liked titles
  - Disliked titles
  - Mapped tags
  - Semantic moods
- Works with *any* language input without requiring the user to know the exact MAL title.

### 5. Performance Optimization
- Anime data and embeddings are cached in JSON for fast startup.
- Requests are cached in memory for 60 seconds to avoid redundant computation.
- OpenAI is skipped when only tags or anime IDs are provided.

---

## Why Ours Is Different

Most anime recommendation systems:
- Rely on **collaborative filtering** — good for popular titles, bad for niche tastes.  
- Only match **tags/genres**, which misses tone, mood, and relationship dynamics.  
- Fail to handle **alternate titles and languages**, making search frustrating.  

**AnimeRecommender** is different because:
- **Multiple input modes** — combine tags, liked/disliked titles, and free-text queries in *one* request.
- **Weighted hybrid scoring** — balance tags, semantic meaning, and title similarity.
- **Multilingual support** — English, native, and synonyms stored and matched automatically.
- **Token efficiency** — OpenAI is only used when needed.
- **Search by feel** — semantic similarity finds shows with the same emotional tone.

---

## Installation

```bash
git clone https://github.com/yourusername/AnimeRecommender.git
cd AnimeRecommender
pip install -r requirements.txt
```

## Running the Data Pipeline
```bash
#Refresh data & embeddings
python backend/scripts/refresh_data_with_embeddings.py
```
## Starting the API Server
```bash
uvicorn backend.app.main:app --reload
```

## Example Request
```json
{
  "liked_ids": [5114, 9253],
  "disliked_ids": [30276],
  "moods": ["dark fantasy", "romance"],
  "query": "I liked the gritty feeling and gore from Attack on Titan but also the romance between two adult men from Heaven Official’s Blessing.",
  "nsfw_ok": false,
  "limit": 5
}
```