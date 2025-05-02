export interface QuakeSummary {
    time: string; // ISO string
    mag: number;
    place: string;
    depth: number;
    lon: number;
    lat: number;
}

export async function fetchQuakes(minMag = 2.5): Promise<QuakeSummary[]> {
    try {
        const url = new URL("/api/quakes/summary", "https://simp-production.up.railway.app");
        url.searchParams.set("min_mag", String(minMag));
        const res = await fetch(url.toString());
        if (!res.ok) {
            const errorText = await res.text().catch(() => "Unknown error");
            throw new Error(`API error (${res.status}): ${errorText}`);
        }
        return res.json();
    } catch (error) {
        console.error("Failed to fetch quakes:", error);
        throw error;
    }
}