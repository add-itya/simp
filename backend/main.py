from __future__ import annotations
import os, asyncio
from datetime import datetime, timedelta, timezone
from typing import List
import httpx
from cachetools import TTLCache
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from schema import QuakeSummary

USGS_FEED = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson"

app = FastAPI(title="QuakeViz API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

RAW_CACHE_TTL = 300                      # 5 min
_raw_cache = TTLCache(maxsize=1, ttl=RAW_CACHE_TTL)
_cache_lock = asyncio.Lock()

async def fetch_raw() -> dict:
    cached = _raw_cache.get("feed")
    if cached is not None:
        return cached

    async with _cache_lock:
        cached = _raw_cache.get("feed")
        if cached is not None:
            return cached

        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(USGS_FEED)
            r.raise_for_status()
            data = r.json()

        _raw_cache["feed"] = data
        return data

@app.get("/api/quakes/raw", summary="Raw USGS GeoJSON feed")
async def raw_proxy() -> dict:
    return await fetch_raw()

@app.get("/api/quakes/summary", response_model=List[QuakeSummary])
async def summary(
    min_mag: float = Query(2.5, ge=0),
    since: datetime | None = Query(None, description="ISO timestamp, default 30 days ago"),
):
    since = since or datetime.now(timezone.utc) - timedelta(days=30)
    feed = await fetch_raw()

    result: list[QuakeSummary] = []
    for feat in feed.get("features", []):
        props = feat["properties"]
        geom = feat["geometry"]
        mag = props.get("mag")
        if mag is None or mag < min_mag:
            continue
        ev_time = datetime.fromtimestamp(props["time"] / 1000, tz=timezone.utc)
        if ev_time < since:
            continue
        lon, lat, depth = geom["coordinates"]
        result.append(
            QuakeSummary(
                time=ev_time,
                mag=mag,
                place=props["place"],
                depth=depth,
                lon=lon,
                lat=lat,
            )
        )
    return result

# the /docs endpoint is available at http://localhost:8000/docs
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8000)), reload=True)
