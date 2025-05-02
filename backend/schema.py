from datetime import datetime
from pydantic import BaseModel, Field

class QuakeSummary(BaseModel):
    time: datetime = Field(..., description="UTC timestamp of the event")
    mag: float = Field(..., ge=0, description="Magnitude on the Richter scale")
    place: str = Field(..., description="Human‑readable location text from USGS")
    depth: float = Field(..., description="Depth in kilometres below the surface")
    lon: float = Field(..., description="Longitude coordinate")
    lat: float = Field(..., description="Latitude coordinate")