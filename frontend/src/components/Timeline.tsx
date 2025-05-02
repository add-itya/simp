import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { QuakeSummary } from "../api";

interface Props { 
  data: QuakeSummary[]; 
  minMag: number;
}

export default function Timeline({ data, minMag }: Props) {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!data.length || !ref.current) return;

    const dailyCounts = d3.rollups(
      data,  // Use data directly since it's already filtered
      v => v.length,
      d => d.time.slice(0, 10) // YYYY‑MM‑DD
    ).sort();

    const w = 1100, h = 180, m = {t:20,r:30,b:40,l:50};
    const svg = d3.select(ref.current)
      .attr("viewBox", `0 0 ${w} ${h}`)
      .attr("role", "img");

    svg.selectAll("*").remove();

    // Add background grid
    svg.append("rect")
      .attr("width", w - m.l - m.r)
      .attr("height", h - m.t - m.b)
      .attr("x", m.l)
      .attr("y", m.t)
      .attr("fill", "#f8fafc")
      .attr("stroke", "#e2e8f0")
      .attr("stroke-width", 1);

    const x = d3.scaleBand()
      .domain(dailyCounts.map(d => d[0]))
      .range([m.l, w - m.r])
      .padding(0.2);

    const y = d3.scaleLinear()
      .domain([0, d3.max(dailyCounts, d => d[1]) || 0])  // Handle case when there's no data
      .nice()
      .range([h - m.b, m.t]);

    // Add Y grid lines
    svg.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(${m.l},0)`)
      .call(
        d3.axisLeft(y)
          .ticks(5)
          .tickSize(-w + m.l + m.r)
          .tickFormat(() => "")
      )
      .call(g => {
        g.select(".domain").remove();
        g.selectAll(".tick line")
          .attr("stroke", "#e2e8f0")
          .attr("stroke-width", 1);
      });

    // Add bars
    svg.append("g")
      .selectAll("rect")
      .data(dailyCounts)
      .enter()
      .append("rect")
      .attr("x", d => x(d[0])!)
      .attr("y", d => y(d[1]))
      .attr("height", d => y(0) - y(d[1]))
      .attr("width", x.bandwidth())
      .attr("fill", "#ff6b6b")  // Match the map's color scheme
      .attr("opacity", 0.7)
      .append("title")
      .text(d => `${d[0]}: ${d[1]} earthquakes`);

    // Add X axis
    const ax = svg.append("g")
      .attr("transform", `translate(0,${h-m.b})`)
      .call(
        d3.axisBottom(x)
          .tickValues(x.domain().filter((_, i) => !(i % 3)))
          .tickFormat(d => {
            const date = new Date(d);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          })
      );

    ax.selectAll("text")
      .attr("fill", "#64748b")
      .attr("font-size", "10px")
      .attr("transform", "rotate(-45)")
      .attr("text-anchor", "end")
      .attr("dx", "-0.8em")
      .attr("dy", "0.15em");

    ax.selectAll("line")
      .attr("stroke", "#94a3b8");
    ax.select(".domain")
      .attr("stroke", "#94a3b8");

    // Add Y axis
    const ay = svg.append("g")
      .attr("transform", `translate(${m.l},0)`)
      .call(d3.axisLeft(y).ticks(5));

    ay.selectAll("text")
      .attr("fill", "#64748b")
      .attr("font-size", "10px");
    ay.selectAll("line")
      .attr("stroke", "#94a3b8");
    ay.select(".domain")
      .attr("stroke", "#94a3b8");

    // Add Y axis label
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", m.l - 40)
      .attr("x", -(h - m.b) / 2)
      .attr("text-anchor", "middle")
      .attr("fill", "#64748b")
      .attr("font-size", "10px")
      .text("Number of Earthquakes");

  }, [data, minMag]);  // Add minMag to dependencies

  return (
    <div className="relative aspect-[6.1/1]">
      <svg 
        ref={ref} 
        width="100%" 
        height="100%"
        className="max-h-[40vh]" 
        aria-label="Timeline of earthquake counts" 
      />
    </div>
  );
}