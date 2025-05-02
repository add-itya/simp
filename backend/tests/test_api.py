from datetime import datetime, timedelta, timezone
import pytest
from fastapi.testclient import TestClient

@pytest.fixture
def sample_quake_data():
    """Sample earthquake data that matches USGS format"""
    now = datetime.now(timezone.utc)
    return {
        "features": [
            {
                "properties": {
                    "mag": 3.1,
                    "place": "Test Location",
                    "time": int(now.timestamp() * 1000),
                },
                "geometry": {
                    "coordinates": [122.5, 37.8, 10.0]
                }
            },
            {
                "properties": {
                    "mag": 4.5,
                    "place": "Another Location",
                    "time": int((now - timedelta(days=1)).timestamp() * 1000),
                },
                "geometry": {
                    "coordinates": [120.0, 35.0, 5.0]
                }
            }
        ]
    }

@pytest.fixture
def mock_fetch_raw(monkeypatch, sample_quake_data):
    """Mock the fetch_raw function to avoid real API calls"""
    async def mock_fetch():
        return sample_quake_data
    monkeypatch.setattr("main.fetch_raw", mock_fetch)

def test_raw_endpoint(client, mock_fetch_raw):
    """Test /api/quakes/raw endpoint"""
    response = client.get("/api/quakes/raw")
    assert response.status_code == 200
    data = response.json()
    assert "features" in data
    assert len(data["features"]) == 2

def test_summary_endpoint_default(client, mock_fetch_raw):
    """Test /api/quakes/summary with default parameters"""
    response = client.get("/api/quakes/summary")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    quake = data[0]
    assert all(key in quake for key in ["time", "mag", "place", "depth", "lon", "lat"])
    assert quake["mag"] >= 2.5

def test_summary_endpoint_magnitude_filter(client, mock_fetch_raw):
    """Test magnitude filtering in summary endpoint"""
    response = client.get("/api/quakes/summary?min_mag=4.0")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["mag"] >= 4.0

def test_summary_endpoint_time_filter(client, mock_fetch_raw):
    """Test time filtering in summary endpoint"""
    now = datetime.now(timezone.utc)
    one_hour_ago = (now - timedelta(hours=1)).replace(microsecond=0).isoformat() 

    if not one_hour_ago.endswith('Z'):
        one_hour_ago += 'Z'
    one_hour_ago = (
        (now - timedelta(hours=1))
        .replace(microsecond=0)
        .isoformat()
        .replace("+00:00", "Z")
    )
        
    response = client.get(f"/api/quakes/summary?since={one_hour_ago}")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1

def test_summary_endpoint_invalid_magnitude(client, mock_fetch_raw):
    """Test error handling for invalid magnitude"""
    response = client.get("/api/quakes/summary?min_mag=-1")
    assert response.status_code == 422

def test_summary_endpoint_invalid_date(client, mock_fetch_raw):
    """Test error handling for invalid date format"""
    response = client.get("/api/quakes/summary?since=invalid-date")
    assert response.status_code == 422

def test_coordinates_order(client, mock_fetch_raw):
    """Test that coordinates are correctly ordered (lat, lon) in response"""
    response = client.get("/api/quakes/summary")
    assert response.status_code == 200
    data = response.json()
    first_quake = data[0]
    assert first_quake["lat"] == 37.8
    assert first_quake["lon"] == 122.5