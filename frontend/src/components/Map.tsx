import { useEffect } from "react";
import * as d3 from "d3";
import { QuakeSummary } from "../api";
import { MapContainer, TileLayer, CircleMarker, Popup, AttributionControl, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Props {
  data: QuakeSummary[];
}

function LegendControl({ radiusScale, colorScale }: { radiusScale: d3.ScalePower<number, number, never>; colorScale: d3.ScaleSequential<string, never> }) {
  const map = useMap();

  useEffect(() => {
    const Legend = L.Control.extend({
      options: { position: "bottomright" },
      onAdd: function(_map: L.Map) {
        const container = L.DomUtil.create("div", "leaflet-control");
        
        const legendSvg = d3.select(container)
          .append("svg")
          .attr("width", 250)
          .attr("height", 120)
          .attr("class", "bg-white/90 rounded-lg shadow-lg");

        // Add legend background
        legendSvg.append("rect")
          .attr("width", "100%")
          .attr("height", "100%")
          .attr("fill", "white")
          .attr("rx", 8);  // Rounded corners to match the rounded-lg class

        // Magnitude legend
        legendSvg.append("text")
          .attr("x", 20)
          .attr("y", 20)
          .attr("fill", "#64748b")
          .attr("font-size", "10px")
          .text("Magnitude");

        [1, 3, 5].forEach((mag, i) => {
          const cx = i * 70 + 40;
          legendSvg.append("circle")
            .attr("cx", cx)
            .attr("cy", 40)
            .attr("r", radiusScale(mag + 2))
            .attr("fill", "none")
            .attr("stroke", "#64748b")
            .attr("stroke-width", 0.5);

          legendSvg.append("text")
            .attr("x", cx)
            .attr("y", 65)
            .attr("text-anchor", "middle")
            .attr("fill", "#64748b")
            .attr("font-size", "9px")
            .text(mag.toString());
        });

        // Depth legend
        legendSvg.append("text")
          .attr("x", 20)
          .attr("y", 85)
          .attr("fill", "#64748b")
          .attr("font-size", "10px")
          .text("Depth (km)");

        const gradientId = "depth-gradient";
        const gradient = legendSvg.append("defs")
          .append("linearGradient")
          .attr("id", gradientId)
          .attr("x1", "100%")
          .attr("x2", "0%");

        gradient.append("stop")
          .attr("offset", "0%")
          .attr("stop-color", colorScale(700));

        gradient.append("stop")
          .attr("offset", "100%")
          .attr("stop-color", colorScale(0));

        legendSvg.append("rect")
          .attr("x", 20)
          .attr("y", 90)
          .attr("width", 100)
          .attr("height", 10)
          .attr("fill", `url(#${gradientId})`);

        // Depth scale ticks
        [0, 350, 700].forEach((depth, i) => {
          legendSvg.append("text")
            .attr("x", 20 + i * 50)
            .attr("y", 110)
            .attr("text-anchor", "middle")
            .attr("fill", "#64748b")
            .attr("font-size", "9px")
            .text(depth.toString());
        });

        return container;
      },
    });

    const legendCtrl = new Legend();
    map.addControl(legendCtrl);
    return () => {
      map.removeControl(legendCtrl);
    };
  }, [map, radiusScale, colorScale]);

  return null;
}

export default function Map({ data }: Props) {
  // Scale for circle radius - adjust domain to match actual data range
  const r = d3.scaleSqrt<number, number>()
    .domain([2.0, 6.0])  // Shifted down by 2 from previous [4.0, 8.0]
    .range([3, 15])
    .clamp(true);

  // Color scale for depth
  const color = d3.scaleSequential()
    .domain([700, 0])  // Keep this order for the map circles
    .interpolator(d3.interpolateRgb("#ff6b6b", "#ffd93d"));

  // Create wrapped data points that repeat across the map
  const wrappedData = data.flatMap(quake => {
    const points: QuakeSummary[] = [];
    // Create 3 copies of each point: original, left, and right
    [-360, 0, 360].forEach(offset => {
      points.push({
        ...quake,
        lon: quake.lon + offset
      });
    });
    return points;
  });

  return (
    <div className="relative aspect-[2.2/1] bg-gray-50 rounded-lg overflow-hidden" style={{ height: "500px" }}>
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: "100%", width: "100%" }}
        zoomControl={true}
        attributionControl={false}
        minZoom={2}
        maxZoom={10}
        worldCopyJump={true}
        maxBounds={[[-85, -Infinity], [85, Infinity]]}
        maxBoundsViscosity={1.0}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {wrappedData.map((quake, i) => (
          <CircleMarker
            key={i}
            center={[quake.lat, quake.lon]}
            radius={r(quake.mag)}
            fillColor={color(quake.depth)}
            fillOpacity={0.6}
            weight={0.5}
            color="#fff"
            pane="markerPane"
          >
            <Popup>
              <div className="text-sm">
                <div><strong>Magnitude:</strong> {quake.mag.toFixed(1)}</div>
                <div><strong>Depth:</strong> {quake.depth.toFixed(1)}km</div>
                <div><strong>Location:</strong> {quake.place}</div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
        <AttributionControl position="bottomright" />
        <LegendControl radiusScale={r} colorScale={color} />
      </MapContainer>
    </div>
  );
}